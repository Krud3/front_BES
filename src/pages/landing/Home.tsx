import React from "react";
import Examples from "@/pages/landing/Examples";
import Features from "@/pages/landing/Features";
import Header from "@/pages/landing/Header";
import Introduction from "@/pages/landing/Introduction";

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
