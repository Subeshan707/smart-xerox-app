import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { register as registerAction, setError } from '../store/authSlice';
import { registerSchema } from '../utils/validators';
import Input from '../shared/Input';
import Button from '../shared/Button';

const accountTypes = [
  {
    value: 'customer',
    label: 'Customer',
    title: 'Create Customer Account',
    description: 'Book slots, upload documents, and track print status.',
  },
  {
    value: 'shopOperator',
    label: 'Shop Owner',
    title: 'Create Shop Owner Account',
    description: 'Open your shop dashboard with queue, pricing, and alerts.',
  },
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((state) => state.auth);
  const initialRole = searchParams.get('role') === 'shopOperator' ? 'shopOperator' : 'customer';
  const [accountType, setAccountType] = React.useState(initialRole);
  const selectedAccount = accountTypes.find((type) => type.value === accountType);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      shopName: '',
      shopAddress: '',
      shopPhone: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      dispatch(setError(null));
      const result = await dispatch(
        registerAction({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: accountType,
          shopName: data.shopName,
          shopAddress: data.shopAddress,
          shopPhone: data.shopPhone,
        })
      );
      if (result?.user?.role === 'shopOperator') {
        navigate('/operator/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch {
      // Error handled in slice
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mb-8 border border-white/20 animate-float">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black mb-4">Join Smart Xerox</h1>
          <p className="text-white/70 text-center max-w-sm text-lg">
            Create your account and start booking print slots in under a minute.
          </p>

          <div className="mt-12 space-y-4 max-w-sm">
            {[
              '✓ Book time slots & skip queues',
              '✓ Track your print status in real-time',
              '✓ Files auto-deleted after printing',
              '✓ Pay online or at the counter',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[#f8fafc] dark:bg-surface-950">
        {/* Premium Soft Animated Mesh Gradient Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-cyan-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>

        {/* Premium Frosted Glass Card Container */}
        <div className="w-full max-w-md relative z-10 bg-white/70 dark:bg-surface-900/60 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-glass-lg border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-brand">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </div>
            <span className="text-xl font-bold dark:text-white">Smart<span className="text-gradient">Xerox</span></span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 rounded-lg bg-white dark:bg-surface-800/50 p-1 border border-surface-200 dark:border-white/10 shadow-sm">
            {accountTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setAccountType(type.value)}
                className={`py-2.5 px-3 rounded-md text-sm font-semibold transition-all ${
                  accountType === type.value
                    ? 'bg-brand-600 text-white shadow-brand'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-white mb-2 tracking-tight">{selectedAccount.title}</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-8">{selectedAccount.description}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2 animate-fade-in-down">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="animate-fade-in-up animation-delay-100 space-y-4">
              <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} className="bg-white/60 dark:bg-surface-900/40 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 shadow-sm dark:text-white" />
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} className="bg-white/60 dark:bg-surface-900/40 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 shadow-sm dark:text-white" />
              <Input label="Phone Number" type="tel" placeholder="9876543210" error={errors.phone?.message} {...register('phone')} className="bg-white/60 dark:bg-surface-900/40 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 shadow-sm dark:text-white" />
            </div>

            {accountType === 'shopOperator' && (
              <div className="space-y-4 p-5 rounded-2xl bg-white/60 dark:bg-surface-800/40 border border-white/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none animate-fade-in-up animation-delay-200 backdrop-blur-md">
                <Input label="Shop Name" placeholder="Campus Xerox Center" {...register('shopName')} className="bg-white/70 dark:bg-surface-900/50 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 dark:text-white" />
                <Input label="Shop Address" placeholder="Near main gate, MG Road" {...register('shopAddress')} className="bg-white/70 dark:bg-surface-900/50 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 dark:text-white" />
                <Input label="Shop Phone" type="tel" placeholder="9876543210" {...register('shopPhone')} className="bg-white/70 dark:bg-surface-900/50 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 dark:text-white" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up animation-delay-200">
              <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} className="bg-white/60 dark:bg-surface-900/40 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 shadow-sm dark:text-white" />
              <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} className="bg-white/60 dark:bg-surface-900/40 focus:bg-white dark:focus:bg-surface-900 backdrop-blur-md border-white/50 dark:border-white/10 shadow-sm dark:text-white" />
            </div>

            <div className="pt-4 animate-fade-in-up animation-delay-300">
              <Button 
                type="submit" 
                loading={loading} 
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.35)] transform hover:-translate-y-1 transition-all duration-300 rounded-xl"
              >
                Create Account
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6 animate-fade-in-up animation-delay-300">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white/50 dark:bg-surface-900/50 backdrop-blur-md rounded-full text-surface-500 dark:text-surface-400 font-medium">or</span>
            </div>
          </div>

          <div className="animate-fade-in-up animation-delay-300">
            <button
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                window.location.href = `${baseUrl.replace('/api', '')}/api/auth/google`;
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/70 dark:bg-surface-800/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-white dark:hover:bg-surface-800 hover:border-white dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-surface-600 dark:text-surface-400 animate-fade-in-up animation-delay-300">
            Already have an account?{' '}
            <Link to={`/login?role=${accountType}`} className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
