import React from "react";
import Header from "@/pages/landing/components/Header";
import Introduction from "@/pages/landing/components/Introduction";
import Features from "@/pages/landing/components/Features";
import Examples from "@/pages/landing/components/Examples";

const Home: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1">
        <section id="introduction">
          <Introduction />
        </section>
        <Features />
        <section id="examples">
          <Examples />
        </section>
      </main>
    </div>
  );
};

export default Home;
