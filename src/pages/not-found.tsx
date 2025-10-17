import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SlimLayout } from "@/components/SlimLayout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SlimLayout>
      <div className="flex">
        <Link to="/" aria-label="Home">
          <Logo className="h-60 w-auto" />
        </Link>
      </div>
      <p className="mt-20 text-sm font-medium text-gray-700">404</p>
      <h1 className="mt-3 text-lg font-semibold text-gray-900">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-gray-700">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <Link to="/">
        <Button className="mt-10">Go back home</Button>
      </Link>
    </SlimLayout>
  );
}
