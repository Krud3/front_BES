# front_BES
```
front_BES
├─ docker-compose.yml
├─ front
│  ├─ .env
│  ├─ components.json
│  ├─ Dockerfile
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ csv
│  │  │  ├─ graph_data.csv
│  │  │  ├─ graph_data_10000_1.csv
│  │  │  ├─ graph_data_10000_3.csv
│  │  │  ├─ graph_data_1000_10.csv
│  │  │  ├─ graph_data_100_1.csv
│  │  │  ├─ graph_data_100_10.csv
│  │  │  ├─ graph_data_100_90.csv
│  │  │  ├─ graph_data_10_5.csv
│  │  │  ├─ graph_data_2000_10.csv
│  │  │  ├─ graph_data_500000_2.csv
│  │  │  ├─ graph_data_50000_1.csv
│  │  │  ├─ graph_data_50000_3.csv
│  │  │  ├─ graph_data_5000_10.csv
│  │  │  ├─ graph_data_500_10.csv
│  │  │  ├─ graph_data_distribution_500000_2.csv
│  │  │  ├─ graph_data_distribution_50000_3.csv
│  │  │  ├─ graph_data_links_10000_1.csv
│  │  │  ├─ graph_data_links_100_1.csv
│  │  │  └─ graph_data_pd.csv
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
│  │  │  ├─ LoginButton.tsx
│  │  │  ├─ Logo.tsx
│  │  │  ├─ LogoutButton.tsx
│  │  │  ├─ mode-toggle.tsx
│  │  │  ├─ NodeInfoTable.tsx
│  │  │  ├─ SlimLayout.tsx
│  │  │  ├─ TableData.tsx
│  │  │  ├─ theme-provider.tsx
│  │  │  └─ ui
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
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ switch.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     └─ tooltip.tsx
│  │  ├─ firebaseConfig.ts
│  │  ├─ hooks
│  │  │  ├─ use-mobile.tsx
│  │  │  ├─ useAuth.ts
│  │  │  └─ usePermissions.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  ├─ authStore.ts
│  │  │  ├─ parseCSVToNodes.ts
│  │  │  ├─ types.ts
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ board
│  │  │  │  ├─ Board.tsx
│  │  │  │  ├─ CSSheet.tsx
│  │  │  │  ├─ Navbar.tsx
│  │  │  │  ├─ PRSheet.tsx
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
│  │  ├─ graph_data_50_10.csv
│  │  └─ graph_data_distribution_50_10.csv
│  ├─ data_generator.py
│  ├─ Dockerfile
│  ├─ process_nodes.py
│  ├─ proper_dates.py
│  ├─ requirements.txt
│  ├─ server.py
│  └─ to_csv.py
├─ README.md
└─ scripts
   ├─ data_generator.py
   ├─ proper_dates.py
   └─ to_csv.py

```