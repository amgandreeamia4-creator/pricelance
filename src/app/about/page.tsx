import React from "react";
import type { Metadata } from "next";
import AboutSection from "@/components/about/AboutSection";
import { ABOUT_SHORT_DESCRIPTION } from "@/config/aboutContent";

export const metadata: Metadata = {
  title: "About PriceLance – Tech Price Comparison That Keeps Expanding",
  description: ABOUT_SHORT_DESCRIPTION,
};

export default function AboutPage() {
  return <AboutSection variant="full" />;
}
