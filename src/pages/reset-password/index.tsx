import useResetPassword from "@/hooks/useResetPassword";
import {
  Box,
  Button,
  Field,
  Fieldset,
  IconButton,
  Input,
  InputGroup,
  Stack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [showPassword, setShowPassword] = useState(false);
  const { mutate: resetPassword, isPending } = useResetPassword();

  // Route security layer
  useEffect(() => {
    if (!token && (!email || !otp)) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, email, otp, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: PasswordFormData) => {
    resetPassword({
      type: "otp",
      email: email,
      otp: otp,
      password: data.password,
    });
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
          <Stack mt={6}>
            <Fieldset.Legend>Reset your password</Fieldset.Legend>
            <Fieldset.HelperText>
              Enter a new password below to update your account access.
            </Fieldset.HelperText>
          </Stack>

          <Stack gap={4} mt={6}>
            <Field.Root invalid={"password" in errors}>
              <Field.Label>
                Enter your new password <Field.RequiredIndicator />
              </Field.Label>
              <InputGroup
                endElement={
                  <IconButton
                    variant={"plain"}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeClosed /> : <Eye />}
                  </IconButton>
                }
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  colorPalette="blue"
                  {...register("password")}
                />
              </InputGroup>
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={"confirmPassword" in errors}>
              <Field.Label>
                Re-enter your new password <Field.RequiredIndicator />
              </Field.Label>
              <InputGroup
                endElement={
                  <IconButton
                    variant={"plain"}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeClosed /> : <Eye />}
                  </IconButton>
                }
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  colorPalette="blue"
                  {...register("confirmPassword")}
                />
              </InputGroup>
              <Field.ErrorText>
                {errors.confirmPassword?.message}
              </Field.ErrorText>
            </Field.Root>

            <Button size={"md"} w={"full"} type="submit" loading={isPending}>
              Reset password
            </Button>
          </Stack>
        </Fieldset.Root>
      </form>
    </Box>
  );
};

export default ResetPassword;
