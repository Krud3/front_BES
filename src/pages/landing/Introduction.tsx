import React from "react";
import { Link } from "react-router-dom";
import logoAvispa2 from "@/assets/logos/JPG/AVISPA.jpg";
import logoPromueva from "@/assets/logos/SVG/promueva.svg";
import logoUnivalle from "@/assets/logos/SVG/univalle.svg";
import logoJaverianaCali from "@/assets/logos/PNG/javeriana2.png";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Introduction: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container className="pb-16 pt-20 text-center lg:pt-32">
      <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-7xl">
        Advanced simulation made accessible for everyone.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700 dark:text-slate-300">
        Our opinion evolution simulator, SiLEnSeSS, combines advanced social
        network models with an intuitive interface, designed so that both the
        general public and scientists can easily understand and apply the
        results. We handle the technical complexity so you can focus on the data
        and its impact.
      </p>
      {!user && (
        <div className="mt-10 flex justify-center gap-x-6">
          {/* <Link to='/register'> */}
          <Link to="/">
            <Button>Register / Log In</Button>
          </Link>
        </div>
      )}
      <div className="flex flex-col mt-36 lg:mt-44 items-center">
        <p className="font-display text-base text-slate-900 dark:text-slate-400">
          With the participation of
        </p>
        <ul
          role="list"
          className="mt-8 flex items-center justify-center gap-x-8 sm:flex-col sm:gap-x-0 sm:gap-y-10 xl:flex-row xl:gap-x-12 xl:gap-y-0 bg-white p-4 max-w-96 rounded-lg"
        >
          {[
            [
              { name: "Promueva", logo: logoPromueva },
              { name: "Universidad del valle", logo: logoUnivalle },
              { name: "Avispa", logo: logoAvispa2 },
              { name: "Javeriana Cali", logo: logoJaverianaCali },
            ],
            /*[
                { name: 'Mirage', logo: logoMirage },
                { name: 'Laravel', logo: logoLaravel },
                { name: 'Statamic', logo: logoStatamic },
                ],*/
          ].map((group, groupIndex) => (
            <li key={groupIndex}>
              <ul
                role="list"
                className="flex flex-col items-center gap-y-8 sm:flex-row sm:gap-x-12 sm:gap-y-0"
              >
                {group.map((company) => (
                  <li key={company.name} className="flex">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-10 w-auto"
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
};

export default Introduction;
