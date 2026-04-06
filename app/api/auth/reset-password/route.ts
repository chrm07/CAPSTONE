import { type NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/storage'

// In-memory storage for reset tokens (will be replaced with database)
const resetTokens = new Map<string, { email: string; expires: number }>()

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const { email, action, token, newPassword } = await request.json()

    if (action === 'request') {
      // Request password reset
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const user = getUserByEmail(email)
      if (!user) {
        // Don't reveal if email exists or not for security
        return NextResponse.json({ 
          success: true, 
          message: 'If an account with that email exists, a reset link has been sent.' 
        })
      }

      // Generate reset token
      const resetToken = generateToken()
      const expires = Date.now() + 60 * 60 * 1000 // 1 hour

      resetTokens.set(resetToken, { email, expires })

      // Get the base URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

      // Send email
      try {
        await fetch(`${baseUrl}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            template: 'password_reset',
            data: { resetUrl },
          }),
        })
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError)
      }

      // Log reset URL to console for testing
      console.log('\n========================================')
      console.log('PASSWORD RESET LINK (Console Mode)')
      console.log('========================================')
      console.log('Email:', email)
      console.log('Reset URL:', resetUrl)
      console.log('Token:', resetToken)
      console.log('Expires:', new Date(expires).toLocaleString())
      console.log('========================================\n')

      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent.',
        // For development testing - shows in browser console
        devResetUrl: resetUrl,
      })
    } 
    
    if (action === 'reset') {
      // Reset password with token
      if (!token || !newPassword) {
        return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
      }

      const tokenData = resetTokens.get(token)
      if (!tokenData) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
      }

      if (Date.now() > tokenData.expires) {
        resetTokens.delete(token)
        return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
      }

      const user = getUserByEmail(tokenData.email)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 })
      }

      // Update password
      updateUser(user.id, { password: newPassword })

      // Delete used token
      resetTokens.delete(token)

      return NextResponse.json({ success: true, message: 'Password has been reset successfully' })
    }

    if (action === 'verify') {
      // Verify token is valid
      if (!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 })
      }

      const tokenData = resetTokens.get(token)
      if (!tokenData || Date.now() > tokenData.expires) {
        return NextResponse.json({ valid: false })
      }

      return NextResponse.json({ valid: true, email: tokenData.email })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
