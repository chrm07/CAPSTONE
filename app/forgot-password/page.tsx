"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, CheckCircle, AlertCircle } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const copyToClipboard = async () => {
    if (resetUrl) {
      await navigator.clipboard.writeText(resetUrl)
      setCopied(true)
      toast({ title: "Copied to clipboard" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          action: 'request',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Reset link generated",
          description: "Use the link below to reset your password.",
        })
        setEmailSent(true)
        
        // Store reset URL for display
        if (data.devResetUrl) {
          setResetUrl(data.devResetUrl)
        }
      } else {
        throw new Error(data.error || 'Failed to generate reset link')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to generate reset link",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {emailSent ? "Check your email for a reset link" : "Enter your email address to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Generating..." : "Generate Reset Link"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-center text-sm">
                  A password reset link has been generated for your account.
                </p>
                
                {resetUrl && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Development Mode</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <p className="mb-2 text-xs">Since email service is not configured, use this link to reset your password:</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 bg-white p-2 rounded text-xs break-all border">
                          {resetUrl}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyToClipboard}
                          className="shrink-0 bg-transparent"
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="mt-3">
                        <Link href={resetUrl}>
                          <Button size="sm" className="w-full">
                            Go to Reset Page
                          </Button>
                        </Link>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent" 
                  onClick={() => {
                    setEmailSent(false)
                    setResetUrl(null)
                    form.reset()
                  }}
                >
                  Try another email
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/90">
                Back to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
