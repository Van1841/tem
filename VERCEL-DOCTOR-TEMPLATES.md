# Deploy a doctor template to Vercel

The three doctor templates are standalone static HTML sites. Each has its own `index.html`, CSS, JavaScript, and a Vercel config. There is no install or build step, and these brochure sites do not need Render.

## Deploy one template

1. Open [Vercel](https://vercel.com/dashboard) and sign in with the GitHub account that can access `Van1841/tem`.
2. Select **Add New… → Project**, then import the `Van1841/tem` repository.
3. In **Configure Project**, set **Project Name** to a unique name, such as `doctor-template-01`.
4. Open **Root Directory → Edit** and choose one folder:
   - `templates/categories/doctor/template-01`
   - `templates/categories/doctor/template-02`
   - `templates/categories/doctor/template-03`
5. Set **Framework Preset** to **Other**. Leave **Build Command** blank. Leave the **Output Directory** at its default (the project root).
6. Select **Deploy**. Vercel will provide a `*.vercel.app` URL when the deployment finishes.
7. Repeat for each other template, using a different project name and root directory each time.

Each Vercel project stays connected to the same GitHub repo but deploys only its selected folder. Future commits can automatically redeploy the connected projects.

## Before sharing a clinic's site

The templates currently use generic clinic copy and stock photos. Replace the clinic name, address, phone, map link, services, and photos with information approved by that clinic. The contact form is currently a front-end demo: it does not send or store appointment requests. Connect a form service or backend before relying on it for bookings. Do not collect patient health information through the demo form.

The pages are static files, so Render is not needed unless you later add a server/API. If you want a custom domain, add it from the deployed project's **Settings → Domains** in Vercel.
