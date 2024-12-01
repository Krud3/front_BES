import React from "react";
import Header from "@/pages/landing/Header";
import Introduction from "@/pages/landing/Introduction";
import Features from "@/pages/landing/Features";
import Examples from "@/pages/landing/Examples";

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
