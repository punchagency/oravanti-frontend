import type { FeeAgreementDocument } from "@/api/leads";
import { dayjs, guessTimezone } from "@/utils/date";

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  if (!iso || !dayjs(iso).isValid()) return "—";
  return dayjs.utc(iso).tz(guessTimezone()).format("MMMM D, YYYY");
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-08-01" → "August 1, 2026". Pure string math — never construct a Date
// or use dayjs here, so the rendered day can't shift with the browser timezone
// and the preview stays string-identical with the backend PDF.
function formatDateOnly(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d || !MONTH_NAMES[m - 1]) return "—";
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function paymentTermsText(doc: FeeAgreementDocument, firmName: string): string {
  if (doc.noUpfrontDue)
    return "No payment is due upon signing this agreement. The firm's fees and any advanced costs are payable solely from the proceeds of a settlement, award, or judgment as described in this agreement.";
  const pay = `Payment may be made by ACH bank transfer, credit card (3% processing fee applies), or certified check payable to ${esc(
    firmName,
  )}.`;
  if (doc.paymentPlan === "two_payments") {
    // Concrete schedules exist only on wizard-era agreements; older rows keep
    // the original generic sentence verbatim.
    const s = doc.twoPaymentsSchedule;
    if (s)
      return `The total amount is payable in two payments: ${money(s.firstAmount)} due upon signing this agreement and ${money(s.secondAmount)} due by ${formatDateOnly(s.secondDueDate)}. ${pay}`;
    return `The total amount is payable in two equal installments: the first due upon signing this agreement and the second within 30 days. ${pay}`;
  }
  if (doc.paymentPlan === "installments") {
    const s = doc.installmentSchedule;
    if (s)
      return `The total amount is payable in ${s.numberOfPayments} monthly installments of ${money(s.monthlyAmount)}, beginning ${formatDateOnly(s.firstPaymentDate)}. ${pay}`;
    return `The total amount is payable in monthly installments per a schedule agreed with the firm, beginning upon signing this agreement. ${pay}`;
  }
  return `The total amount is due in full upon signing this agreement. ${pay} Failure to remit payment within 7 days of signing may result in withdrawal of representation.`;
}

function paymentAllocationText(
  allocation: NonNullable<FeeAgreementDocument["paymentAllocation"]>,
): string {
  if (allocation.order === "fees_first")
    return "Payments received are applied first to attorney fees, then to costs and disbursements.";
  if (allocation.order === "costs_first")
    return "Payments received are applied first to costs and disbursements, then to attorney fees.";
  const feePct = allocation.customFeePercent ?? 0;
  return `Payments received are allocated ${feePct}% to attorney fees and ${100 - feePct}% to costs and disbursements.`;
}

function contingencyTermsText(
  terms: NonNullable<FeeAgreementDocument["contingencyTerms"]>,
): string {
  const covers = `The contingency percentage covers attorney fees${
    terms.coversCaseCosts ? ", case costs and disbursements" : ""
  }${terms.coversExpertWitnessFees ? ", and expert witness fees" : ""}.`;
  const ifLost =
    terms.ifLost === "client_owes_nothing"
      ? "If the case is lost or no recovery is obtained, Client owes nothing and the firm absorbs all advanced costs."
      : "If the case is lost or no recovery is obtained, Client remains responsible for reimbursing hard costs advanced by the firm.";
  const aba = `The supervising attorney confirmed on ${formatDateOnly(
    terms.abaConfirmedAt.slice(0, 10),
  )} that this agreement complies with ABA Model Rule 1.5(c), states the method by which the fee is determined (including litigation and other expenses and post-judgment collection costs), and that alternative billing arrangements were discussed with the client.`;
  return `${covers} ${ifLost} ${aba}`;
}

// Builds a self-contained, inline-styled HTML string for the fee-agreement
// document. Used both for the in-app preview (dangerouslySetInnerHTML) and the
// print-to-PDF window. All dynamic values are HTML-escaped.
export function buildFeeAgreementHtml(doc: FeeAgreementDocument): string {
  const firmName = doc.firm.name;
  const state = doc.firm.state ?? "the applicable";
  const cityCounty = doc.firm.city ? `${esc(doc.firm.city)} County` : "the firm's county";

  const cityStateZip = [
    doc.firm.city,
    [doc.firm.state, doc.firm.zipCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  const firmAddressLine = [doc.firm.address, cityStateZip]
    .filter(Boolean)
    .join(" · ");
  const firmContactLine = [
    doc.firm.phone ? `T: ${doc.firm.phone}` : null,
    doc.firm.email,
  ]
    .filter(Boolean)
    .join(" · ");

  const feeRows = doc.feeLines
    .map(
      (l, i) => `
      <tr style="background:${i % 2 ? "#faf9f6" : "#fff"};">
        <td style="padding:11px 14px;border-bottom:1px solid #eee;">${esc(
          l.description,
        )}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums;">${
          l.amount == null ? "—" : money(l.amount)
        }</td>
      </tr>`,
    )
    .join("");

  const hasDeferred = doc.feeLines.some((l) => l.deferred);

  const consultationCredit = doc.applyConsultationCredit
    ? `
    <div style="margin-top:14px;padding:14px 16px;background:#f4f2ec;border-radius:8px;">
      <div style="font-weight:600;font-size:13px;color:#333;margin-bottom:4px;">Consultation fee credit</div>
      <div style="font-size:13px;color:#555;line-height:1.5;">
        If a consultation fee${
          doc.consultationFeeAmount != null
            ? ` of ${money(doc.consultationFeeAmount)}`
            : ""
        } was collected prior to this engagement, it will be credited against the
        total amount due at the discretion of the supervising attorney. Please
        reference your consultation receipt when making payment.
      </div>
    </div>`
    : "";

  const terms = [
    `This agreement constitutes the entire understanding between the parties regarding legal representation in the matter stated above.`,
    `Either party may terminate this agreement upon written notice. Client remains responsible for fees incurred prior to termination.`,
    `${esc(firmName)} maintains professional liability insurance as required by ${esc(
      state,
    )} State bar rules.`,
    `Disputes arising from this agreement shall be resolved by binding arbitration under the AAA Commercial Rules in ${cityCounty}.`,
    `This agreement is governed by the laws of the State of ${esc(state)}.`,
  ]
    .map(
      (t, i) =>
        `<div style="font-size:12px;color:#666;line-height:1.6;">${i + 1}. ${t}</div>`,
    )
    .join("");

  const label = (t: string) =>
    `<div style="font-size:11px;font-weight:600;letter-spacing:0.05em;color:#8a8577;text-transform:uppercase;">${t}</div>`;

  const contingencySection =
    doc.contingencyPercent != null
      ? `
    <div style="margin-top:20px;">${label("Contingency fee")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">
        In addition to any amounts stated above, Client agrees to pay ${esc(
          firmName,
        )} a contingency fee of ${doc.contingencyPercent}% of the gross amount of any settlement, award, or judgment obtained in this matter. If no recovery is obtained, no contingency fee is owed.${
          doc.noUpfrontDue
            ? " No upfront attorney fee is charged for this engagement."
            : ""
        }
      </div>
    </div>`
      : "";

  // Wizard-era agreements only; empty on rows generated before the wizard.
  const contingencyTermsSection = doc.contingencyTerms
    ? `
    <div style="margin-top:20px;">${label("Contingency terms")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">
        ${contingencyTermsText(doc.contingencyTerms)}
      </div>
    </div>`
    : "";

  // When the wizard captured "client owes nothing", the closing sentence must
  // not contradict it. Old rows (no contingencyTerms) keep the original text.
  const advancedCostsClosing =
    doc.contingencyTerms?.ifLost === "client_owes_nothing"
      ? "If no recovery is obtained, the firm absorbs all advanced costs."
      : "If no recovery is obtained, Client remains responsible for reimbursing advanced costs.";
  const advancedCostsSection =
    doc.governmentFeesPaidBy === "firm_advanced" &&
    doc.feeLines.some((l) => l.description.includes("advanced by firm"))
      ? `
    <div style="margin-top:20px;">${label("Advanced costs")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">
        ${esc(
          firmName,
        )} will advance the government filing fees and costs listed above on Client's behalf. Advanced amounts will be recovered from the proceeds of any settlement, award, or judgment prior to the calculation of the contingency fee. ${advancedCostsClosing}
      </div>
    </div>`
      : "";

  const allocationSection = doc.noUpfrontDue
    ? ""
    : `
    <div style="margin-top:20px;">${label("Account allocation")}
      <div style="display:flex;border:1px solid #e6e3da;border-radius:8px;margin-top:8px;">
        <div style="flex:1;padding:12px 16px;border-right:1px solid #e6e3da;">
          <div style="font-size:11px;color:#8a8577;text-transform:uppercase;">Operating account</div>
          <div style="font-size:15px;font-weight:600;margin-top:4px;">${money(
            doc.allocation.operating,
          )}</div>
        </div>
        <div style="flex:1;padding:12px 16px;border-right:1px solid #e6e3da;">
          <div style="font-size:11px;color:#8a8577;text-transform:uppercase;">Trust (IOLTA)</div>
          <div style="font-size:15px;font-weight:600;margin-top:4px;">${money(
            doc.allocation.trust,
          )}</div>
        </div>
        <div style="flex:1;padding:12px 16px;background:#f4f2ec;">
          <div style="font-size:11px;color:#8a8577;text-transform:uppercase;">Total</div>
          <div style="font-size:15px;font-weight:600;margin-top:4px;">${money(
            doc.allocation.total,
          )}</div>
        </div>
      </div>
    </div>`;

  // Wizard-era agreements only; empty on rows generated before the wizard.
  const paymentAllocationSection = doc.paymentAllocation
    ? `
    <div style="margin-top:20px;">${label("Payment allocation")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">${paymentAllocationText(
        doc.paymentAllocation,
      )}</div>
    </div>`
    : "";

  return `
  <div style="font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:660px;margin:0 auto;padding:8px 4px;">
    <div style="text-align:center;">
      <div style="font-size:18px;font-weight:700;">${esc(firmName)}</div>
      ${firmAddressLine ? `<div style="font-size:12px;color:#666;margin-top:4px;">${esc(firmAddressLine)}</div>` : ""}
      ${firmContactLine ? `<div style="font-size:12px;color:#666;">${esc(firmContactLine)}</div>` : ""}
    </div>
    <div style="border-top:1px solid #e6e3da;margin:16px 0;"></div>
    <div style="text-align:center;">
      <div style="font-size:16px;font-weight:600;">Legal services agreement</div>
      <div style="font-size:12px;color:#8a8577;margin-top:2px;">Retainer &amp; fee agreement</div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:20px;">
      <div>${label("Document ref")}<div style="font-size:14px;font-weight:600;margin-top:2px;">${esc(
        doc.docRef,
      )}</div></div>
      <div style="text-align:right;">${label("Date prepared")}<div style="font-size:14px;font-weight:600;margin-top:2px;">${esc(
        formatDate(doc.datePrepared),
      )}</div></div>
    </div>

    <div style="display:flex;border:1px solid #e6e3da;border-radius:8px;margin-top:14px;">
      <div style="flex:1;padding:14px 16px;border-right:1px solid #e6e3da;">
        ${label("Law firm (service provider)")}
        <div style="font-size:14px;font-weight:600;margin-top:6px;">${esc(firmName)}</div>
        ${doc.firm.address ? `<div style="font-size:12px;color:#555;">${esc(doc.firm.address)}</div>` : ""}
        ${cityStateZip ? `<div style="font-size:12px;color:#555;">${esc(cityStateZip)}</div>` : ""}
        <div style="font-size:12px;color:#555;margin-top:6px;">Attorney: <b>${esc(
          doc.attorneyName,
        )}</b></div>
      </div>
      <div style="flex:1;padding:14px 16px;">
        ${label("Client (service recipient)")}
        <div style="font-size:14px;font-weight:600;margin-top:6px;">${esc(doc.client.name)}</div>
        <div style="font-size:12px;color:#555;margin-top:6px;">Matter type: ${esc(
          doc.client.matterType,
        )}</div>
      </div>
    </div>

    <div style="margin-top:20px;">${label("Scope of representation")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">
        ${esc(firmName)} agrees to provide legal representation in the matter identified above.
        Services include preparation and filing of all applicable forms, correspondence with
        relevant government agencies, and legal advice throughout the proceedings. This agreement
        does not cover appeals, removal proceedings, or matters outside the stated matter type
        unless a separate written agreement is executed.
      </div>
    </div>

    <div style="margin-top:20px;">${label("Attorney fees")}
      <table style="width:100%;border-collapse:collapse;margin-top:8px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f4f2ec;">
          <th style="text-align:left;padding:9px 14px;font-size:11px;letter-spacing:0.04em;color:#8a8577;text-transform:uppercase;">Description</th>
          <th style="text-align:right;padding:9px 14px;font-size:11px;letter-spacing:0.04em;color:#8a8577;text-transform:uppercase;">Amount</th>
        </tr></thead>
        <tbody>
          ${feeRows}
          <tr><td style="padding:11px 14px;font-weight:700;">${
            hasDeferred ? "Total due upfront" : "Total due"
          }</td>
          <td style="padding:11px 14px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">${money(
            doc.totalDue,
          )}</td></tr>
        </tbody>
      </table>
    </div>
    ${contingencySection}
    ${contingencyTermsSection}
    ${advancedCostsSection}
    ${allocationSection}

    <div style="margin-top:20px;">${label("Payment terms")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">${paymentTermsText(
        doc,
        firmName,
      )}</div>
    </div>
    ${paymentAllocationSection}
    ${consultationCredit}

    <div style="margin-top:20px;">${label("Terms &amp; conditions")}
      <div style="margin-top:6px;display:grid;gap:4px;">${terms}</div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:32px;gap:24px;">
      <div style="flex:1;">${label("Client signature")}
        <div style="margin-top:34px;font-size:13px;">${esc(doc.client.name)}</div>
        <div style="font-size:12px;color:#888;">Date: __________________</div>
      </div>
      <div style="flex:1;">${label("Attorney signature")}
        <div style="margin-top:34px;font-size:13px;">${esc(doc.attorneyName)}, Esq.</div>
        <div style="font-size:12px;color:#888;">Date: __________________</div>
      </div>
    </div>

    <div style="text-align:center;margin-top:26px;font-size:11px;color:#a09a8c;line-height:1.5;">
      This document is generated by Oravanti and presented for review before dispatch. It has not yet
      been signed or sent to the client. All figures are estimates pending attorney review.
    </div>
  </div>`;
}
