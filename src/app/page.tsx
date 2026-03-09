import { redirect } from 'next/navigation';

export default function Home() {
  // Middleware handles the redirect based on role
  redirect('/login');
}
