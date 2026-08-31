import { createFileRoute } from "@tanstack/react-router";
import { OctavaApp } from "@/components/octava/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <OctavaApp />;
}
