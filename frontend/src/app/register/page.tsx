"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { registerRequest } from "@/lib/auth-api";
import { getErrorMessage } from "@/lib/error-message";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): { label: string; width: string; color: string } {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Weak", width: "30%", color: "bg-ember" };
  }

  if (score <= 3) {
    return { label: "Medium", width: "65%", color: "bg-amber-500" };
  }

  return { label: "Strong", width: "100%", color: "bg-emerald-500" };
}

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const passwordValue = watch("password") ?? "";
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");

    try {
      await registerRequest({
        name: values.name,
        email: values.email,
        password: values.password
      });

      toast.success("Account created. Please login.");
      router.replace("/login");
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create account. Please try again."));
    }
  });

  return (
    <AuthShell
      title="Create Account"
      subtitle="Start with a secure account and access your dashboard in seconds."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-sky transition hover:text-ink">
            Login here
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField label="Name" autoComplete="name" placeholder="Jane Doe" error={errors.name?.message} {...register("name")} />

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
          autoComplete="new-password"
          placeholder="Create a strong password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/70">
            <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
          </div>
          <p className="text-xs text-ink/70">Password strength: {passwordStrength.label}</p>
        </div>

        <TextField
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {formError ? <p className="rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember">{formError}</p> : null}

        <Button type="submit" loading={isSubmitting}>
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
