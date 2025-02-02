"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
//@ts-expect-error
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import type React from "react"; // Added import for React

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        username: email,
        password,
      });
      const accessToken = response.data.access;

      Cookies.set("token", accessToken, {
        expires: 1,
        secure: true,
        sameSite: "strict",
      });

      setError("");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-[#2a2a2a] border-[#333] text-white shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {/* <LogIn className="w-6 h-6 text-[#e97451]" /> */}
            Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-[#333] pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*********"
                    className="border-[#333] pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-[#e97451] hover:bg-[#d86440] transition-colors"
              >
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 w-full">
          <div className="text-sm flex text-gray-400 ">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="flex items-center justify-center ml-2 text-[#e97451] underline "
            >
              Register
            </Link>
          </div>
          {/* <Button
            variant="outline"
            className="w-full border-[#e97451] text-[#e97451] hover:bg-[#e97451] hover:text-white transition-colors"
          >
            <Link href="/register" className="flex items-center justify-center w-full">
              Register
            </Link>
          </Button> */}
        </CardFooter>
      </Card>
    </div>
  );
}
