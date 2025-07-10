import React, { useEffect, useState } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import clsx from "clsx";
import { Lumiflex } from "uvcanvas";
import { Container } from "@/components/Container";
import screenshotExpenses from "@/assets/images/example2.png";
import screenshotPayroll from "@/assets/images/example1.png";
import screenshotReporting from "@/assets/images/example4.png";
import screenshotVatReturns from "@/assets/images/example3.png";

const features = [
  {
    title: "Create Custom Simulations",
    description:
      "Build simulations from scratch or use existing network data to model specific scenarios.",
    image: screenshotPayroll,
  },
  {
    title: "View Detailed Simulation Results",
    description:
      "Track how opinions change and evolve through multiple iterations, providing valuable insights into social dynamics.",
    image: screenshotExpenses,
  },
  {
    title: "Detailed Analysis",
    description:
      "Access in-depth simulation results, including general, network-wide, and agent-specific insights.",
    image: screenshotVatReturns,
  },
  {
    title: "Integration with TimeScale",
    description:
      "Leverage TimeScale for efficient data storage and analysis of long-term simulations.",
    image: screenshotReporting,
  },
];

const Features: React.FC = () => {
  const [tabOrientation, setTabOrientation] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

  useEffect(() => {
    let lgMediaQuery = window.matchMedia("(min-width: 1024px)");

    function onMediaQueryChange({ matches }: { matches: boolean }) {
      setTabOrientation(matches ? "vertical" : "horizontal");
    }

    onMediaQueryChange(lgMediaQuery);
    lgMediaQuery.addEventListener("change", onMediaQueryChange);

    return () => {
      lgMediaQuery.removeEventListener("change", onMediaQueryChange);
    };
  }, []);

  return (
    <section id="features" className="relative  overflow-hidden pb-28 pt-20 sm:py-32">
      {/* Fondo Lumiflex */}
      <div className="absolute inset-0 -z-10"   style={{
        
        objectFit: "cover",
      }}>
        <Lumiflex />
      </div>

      {/* Contenido */}
      <Container className="relative bg-gray-600 rounded-lg shadow-md p-6">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
            Everything you need to simulate and analyze social networks.
          </h2>
          <p className="mt-6 text-lg tracking-tight text-blue-100">
            Our opinion evolution simulator, SiLEnSeSS, provides all the tools you need to create,
            customize, and analyze social network simulations with ease. Whether you're a scientist
            or part of the general public, our intuitive interface lets you focus on understanding
            the data without getting bogged down in the technical details.
          </p>
        </div>
        <TabGroup
          className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
          vertical={tabOrientation === "vertical"}
        >
          {({ selectedIndex }: { selectedIndex: number }) => (
            <>
            <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
            <TabList className="relative z-10 flex gap-x-4 whitespace-nowrap px-4 sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
                {features.map((feature, featureIndex) => (
                  <div
                    key={feature.title}
                    className={clsx(
                      "group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6",
                      selectedIndex === featureIndex
                        ? "bg-gray-800 lg:bg-gray-800 lg:ring-2 lg:ring-inset lg:ring-gray-700"
                        : "hover:bg-gray-700 lg:hover:bg-gray-600"
                    )}
                  >
                    <h3>
                      <Tab
                        className={clsx(
                          "font-display text-lg focus:outline-none",
                          selectedIndex === featureIndex
                            ? "text-blue-600 lg:text-white"
                            : "text-blue-100 hover:text-white lg:text-white"
                        )}
                      >
                        <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                        {feature.title}
                      </Tab>
                    </h3>
                    <p
                      className={clsx(
                        "mt-2 hidden text-sm lg:block",
                        selectedIndex === featureIndex
                          ? "text-white"
                          : "text-blue-100 group-hover:text-white"
                      )}
                    >
                      {feature.description}
                    </p>
                  </div>
                ))}
              </TabList>
            </div>

            <TabPanels className="lg:col-span-7">
                {features.map((feature) => (
                  <TabPanel key={feature.title} unmount={false}>
                    <div className="relative sm:px-6 lg:hidden">
                      <div className="absolute -inset-x-4 bottom-[-4.25rem] top-[-6.5rem] bg-white/10 ring-1 ring-inset ring-white/10 sm:inset-x-0 sm:rounded-t-xl" />
                      <p className="relative mx-auto max-w-2xl text-base text-white sm:text-center">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-10 w-[45rem] overflow-hidden rounded-xl bg-slate-50 shadow-xl shadow-blue-900/20 sm:w-auto lg:mt-0 lg:w-[67.8125rem]">
                      <img
                        className="w-full"
                        src={feature.image}
                        alt=""
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </TabPanel>
                ))}
              </TabPanels>
            </>
          )}
        </TabGroup>
      </Container>
    </section>
  );
};

export default Features;
