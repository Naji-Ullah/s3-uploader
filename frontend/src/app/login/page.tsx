"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { loginRequest } from "@/lib/auth-api";
import { getErrorMessage } from "@/lib/error-message";
import { getStoredAuth } from "@/lib/auth-storage";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    const auth = getStoredAuth();

    if (auth?.accessToken) {
      router.replace("/dashboard");
    }
  }, [router]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");

    try {
      await loginRequest({
        email: values.email,
        password: values.password
      });

      toast.success("Welcome back");
      router.replace("/dashboard");
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to login. Please try again."));
    }
  });

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to continue managing your uploads and dashboard."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-sky transition hover:text-ink">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />

        {formError ? <p className="rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember">{formError}</p> : null}

        <Button type="submit" loading={isSubmitting}>
          Login
        </Button>
      </form>
    </AuthShell>
  );
}
