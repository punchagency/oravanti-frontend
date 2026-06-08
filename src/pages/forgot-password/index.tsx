import useSendOtp from "@/hooks/useSendOtp";
import {
  Box,
  Button,
  Field,
  Fieldset,
  IconButton,
  Input,
  Stack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim(),
});

type EmailFormData = z.infer<typeof emailSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { mutate: sendOtp, isPending } = useSendOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: EmailFormData) => {
    sendOtp(
      { email: data.email, type: "forget-password" },
      {
        onSuccess: () => {
          // Navigates directly into the nested sub-route layout path
          navigate("/forgot-password/verify-otp", {
            state: { email: data.email },
          });
        },
      },
    );
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
          <Link to={"/login"}>
            <IconButton size="sm" variant="outline" type="button">
              <CircleArrowLeft />
            </IconButton>
          </Link>
          <Stack mt={6}>
            <Fieldset.Legend>Forgot Password</Fieldset.Legend>
            <Fieldset.HelperText>
              Enter your email below to request a security verification code.
            </Fieldset.HelperText>
          </Stack>

          <Stack gap={4} mt={6}>
            <Field.Root invalid={"email" in errors}>
              <Field.Label>
                Email Address <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="email"
                colorPalette="blue"
                placeholder="name@domain.com"
                {...register("email")}
              />
              <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>

            <Button size={"md"} w={"full"} type="submit" loading={isPending}>
              Send Verification Code
            </Button>
          </Stack>
        </Fieldset.Root>
      </form>
    </Box>
  );
};

export default ForgotPassword;
