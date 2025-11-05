import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './AuthProvider';
import { useState } from 'react';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().default(true),
});

const signUpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
  isHealthcareProfessional: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are a licensed healthcare professional' }),
  }),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

const LoginScreen = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  const signInForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { remember: true } });
  const signUpForm = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const onSignIn = async (values: SignInValues) => {
    setLoading(true);
    try {
      await signIn({ email: values.email, password: values.password, remember: values.remember });
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (values: SignUpValues) => {
    setLoading(true);
    try {
      await signUp({ email: values.email, password: values.password, fullName: values.fullName, isHealthcareProfessional: values.isHealthcareProfessional });
      setTab('signin');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    const email = signInForm.getValues('email');
    if (!email) {
      signInForm.setError('email', { type: 'manual', message: 'Enter your email to reset password' });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Welcome to Nelson-GPT</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form className="space-y-4" onSubmit={signInForm.handleSubmit(onSignIn)}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...signInForm.register('email')} />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...signInForm.register('password')} />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={signInForm.watch('remember')} onCheckedChange={(v) => signInForm.setValue('remember', Boolean(v))} />
                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                  </div>
                  <button type="button" className="text-sm text-primary hover:underline" onClick={onForgot} disabled={loading}>
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form className="space-y-4" onSubmit={signUpForm.handleSubmit(onSignUp)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name (optional)</Label>
                  <Input id="fullName" placeholder="Dr. Jane Doe" {...signUpForm.register('fullName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" placeholder="you@example.com" {...signUpForm.register('email')} />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" placeholder="••••••••" {...signUpForm.register('password')} />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="hcp" onCheckedChange={(v) => signUpForm.setValue('isHealthcareProfessional', Boolean(v), { shouldValidate: true })} />
                  <Label htmlFor="hcp" className="text-sm leading-tight">
                    I am a licensed healthcare professional and agree to use Nelson-GPT for professional purposes.
                  </Label>
                </div>
                {signUpForm.formState.errors.isHealthcareProfessional && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.isHealthcareProfessional.message as string}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
