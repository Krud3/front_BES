# front_BES

```
front_BES
├─ docker-compose.yml
├─ front
│  ├─ components.json
│  ├─ Dockerfile
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ csv
│  │  │  └─ graph_data.csv
│  │  ├─ simulations.json
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  ├─ images
│  │  │  │  ├─ example1.png
│  │  │  │  ├─ example2.png
│  │  │  │  ├─ example3.png
│  │  │  │  └─ example4.png
│  │  │  ├─ logos
│  │  │  │  ├─ JPG
│  │  │  │  │  └─ AVISPA.jpg
│  │  │  │  └─ SVG
│  │  │  │     ├─ avispa.svg
│  │  │  │     ├─ logo-bes.svg
│  │  │  │     ├─ promueva.svg
│  │  │  │     └─ univalle.svg
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ AuthProvider.tsx
│  │  │  ├─ Container.tsx
│  │  │  ├─ CustomSimulationForm.tsx
│  │  │  ├─ LoginButton.tsx
│  │  │  ├─ Logo.tsx
│  │  │  ├─ LogoutButton.tsx
│  │  │  ├─ mode-toggle.tsx
│  │  │  ├─ NodeInfoTable.tsx
│  │  │  ├─ SimulationChart.tsx
│  │  │  ├─ SimulationForm.tsx
│  │  │  ├─ SlimLayout.tsx
│  │  │  ├─ TableData.tsx
│  │  │  ├─ theme-provider.tsx
│  │  │  └─ ui
│  │  │     ├─ alert.tsx
│  │  │     ├─ breadcrumb.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ command.tsx
│  │  │     ├─ context-menu.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ menubar.tsx
│  │  │     ├─ navigation-menu.tsx
│  │  │     ├─ pagination.tsx
│  │  │     ├─ select.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ slider.tsx
│  │  │     ├─ switch.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     └─ tooltip.tsx
│  │  ├─ contexts
│  │  │  └─ WebSocketContext.tsx
│  │  ├─ firebaseConfig.ts
│  │  ├─ hooks
│  │  │  ├─ use-mobile.tsx
│  │  │  ├─ useAuth.ts
│  │  │  ├─ usePermissions.ts
│  │  │  └─ useSimulationHistory.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  ├─ authStore.ts
│  │  │  ├─ parseCSVToNodes.ts
│  │  │  ├─ types.ts
│  │  │  ├─ UserDAO.ts
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ admin
│  │  │  │  └─ AdminPage.tsx
│  │  │  ├─ board
│  │  │  │  ├─ Board.tsx
│  │  │  │  ├─ CSSheet.tsx
│  │  │  │  ├─ CustomSimulationPage.tsx
│  │  │  │  ├─ Navbar.tsx
│  │  │  │  ├─ PRSheet.tsx
│  │  │  │  ├─ SimulationPage.tsx
│  │  │  │  ├─ UploadDialog.tsx
│  │  │  │  └─ UploadSheet.tsx
│  │  │  ├─ Display.tsx
│  │  │  ├─ landing
│  │  │  │  ├─ Examples.tsx
│  │  │  │  ├─ Features.tsx
│  │  │  │  ├─ Header.tsx
│  │  │  │  ├─ Home.tsx
│  │  │  │  ├─ Introduction.tsx
│  │  │  │  └─ LoginPage.tsx
│  │  │  ├─ not-found.tsx
│  │  │  └─ on-construction.tsx
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ pol_measures_server
│  ├─ csv
│  │  └─ graph_data_50_10.csv
│  ├─ data_generator.py
│  ├─ Dockerfile
│  ├─ example.json
│  ├─ process_nodes.py
│  ├─ proper_dates.py
│  ├─ requirements.txt
│  ├─ server.py
│  ├─ serverjson.py
│  └─ to_csv.py
├─ README.md
└─ scripts
   ├─ data_generator.py
   ├─ proper_dates.py
   └─ to_csv.py

```