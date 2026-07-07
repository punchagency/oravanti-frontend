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

function paymentTermsText(
  plan: FeeAgreementDocument["paymentPlan"],
  firmName: string,
): string {
  const pay = `Payment may be made by ACH bank transfer, credit card (3% processing fee applies), or certified check payable to ${esc(
    firmName,
  )}.`;
  if (plan === "two_payments")
    return `The total amount is payable in two equal installments: the first due upon signing this agreement and the second within 30 days. ${pay}`;
  if (plan === "installments")
    return `The total amount is payable in monthly installments per a schedule agreed with the firm, beginning upon signing this agreement. ${pay}`;
  return `The total amount is due in full upon signing this agreement. ${pay} Failure to remit payment within 7 days of signing may result in withdrawal of representation.`;
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
        <td style="padding:11px 14px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums;">${money(
          l.amount,
        )}</td>
      </tr>`,
    )
    .join("");

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
          <tr><td style="padding:11px 14px;font-weight:700;">Total due</td>
          <td style="padding:11px 14px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">${money(
            doc.totalDue,
          )}</td></tr>
        </tbody>
      </table>
    </div>

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
    </div>

    <div style="margin-top:20px;">${label("Payment terms")}
      <div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px;">${paymentTermsText(
        doc.paymentPlan,
        firmName,
      )}</div>
    </div>
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
