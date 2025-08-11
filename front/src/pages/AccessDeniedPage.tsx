import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SlimLayout } from '@/components/SlimLayout';
import { ShieldAlert } from 'lucide-react'; // A fitting icon

export default function AccessDeniedPage() {
  return (
    <SlimLayout>
      <div className="flex justify-center">
        <ShieldAlert className="h-24 w-24 text-red-500" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
        Access Denied
      </h1>
      <p className="mt-3 text-sm text-gray-700 dark:text-gray-400">
        Sorry, you do not have the necessary permissions to view this page.
      </p>
      <Link to="/home">
        <Button className="mt-10">
          Go back home
        </Button>
      </Link>
    </SlimLayout>
  );
}