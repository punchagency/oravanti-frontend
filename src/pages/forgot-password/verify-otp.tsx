import { Box, Button, Field, Fieldset, Input, Stack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { z } from "zod";

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Code must be 6 digits.")
    .max(6, "Code must be 6 digits.")
    .trim(),
});

type OtpFormData = z.infer<typeof otpSchema>;

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = (data: OtpFormData) => {
    // Pushes both values out to the global independent target route
    navigate("/reset-password", { state: { email, otp: data.otp } });
  };

  return (
    <Box mt={"72px"} px={4}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset.Root
          maxW="md"
          mx="auto"
          px={4}
          py={8}
          rounded={"lg"}
          bg={"bg.subtle"}
          borderWidth={1}
          borderColor={"border.muted"}
        >
          <Box>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => navigate("/forgot-password")}
            >
              <CircleArrowLeft /> Change email
            </Button>
          </Box>

          <Stack mt={6}>
            <Fieldset.Legend>Verify Your Email</Fieldset.Legend>
            <Fieldset.HelperText>
              Type the 6-digit verification token sent to <b>{email}</b>.
            </Fieldset.HelperText>
          </Stack>

          <Stack gap={4} mt={6}>
            <Field.Root invalid={"otp" in errors}>
              <Field.Label>
                6-Digit Verification Code <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                colorPalette="blue"
                {...register("otp")}
              />
              <Field.ErrorText>{errors.otp?.message}</Field.ErrorText>
            </Field.Root>

            <Button size={"md"} w={"full"} type="submit">
              Verify Code
            </Button>
          </Stack>
        </Fieldset.Root>
      </form>
    </Box>
  );
};

export default VerifyOtp;
