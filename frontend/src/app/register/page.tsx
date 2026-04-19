"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
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
      title="Register"
      subtitle="Create an account to manage and track all uploaded files."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-yellow-300 transition hover:text-yellow-200">
            Login
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
          hint="Use at least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />

        <TextField
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {formError ? <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p> : null}

        <Button type="submit" loading={isSubmitting}>
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
