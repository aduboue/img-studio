# Infrastructure setup guide for ImgStudio

## 0\\ Get access to **Imagen models**

- **In general, for Vertex** in the console
  - Go to `Vertex AI` \> `Enable all recommended APIs` (they should include: **Vertex AI API, Cloud Storage API)**
  - Make sure the Vertex Service Account exists in your project `service-PROJECT_NUMBER@gcp-sa-aiplatform.iam.gserviceaccount.com`
- **For Imagen > Generation**
  - Models are now in public GA, **Imagen 3 Generate** (`imagen-3.0-generate-001`) and **Imagen 3 Generate Fast** (`imagen-3.0-fast-generate-001`)
  - **For people generation** (adult and/ or children), you now need to fill out [this form](https://docs.google.com/forms/d/e/1FAIpQLSduBp9w84qgim6vLriQ9p7sdz62bMJaL-nNmIVoyiOwd84SMw/viewform) to get access.
- **For Imagen > Editing & Customization**
  - You can fill out [this form](https://docs.google.com/forms/d/e/1FAIpQLScN9KOtbuwnEh6pV7xjxib5up5kG_uPqnBtJ8GcubZ6M3i5Cw/viewform) to get access to the Preview feature (name: `imagen-3.0-capability-001`)
  - You will also need the **Vertex Image Segmentation model** when using editing, fill out [this form](https://docs.google.com/forms/d/e/1FAIpQLSdzIR1EeQGFcMsqd9nPip5e9ovDKSjfWRd58QVjo1zLpfdvEg/viewform?resourcekey=0-Pvqc66u-0Z1QmuzHq4wLKg&pli=1) to get access (name: `image-segmentation-001`)
- **For Veo > Generation**
  - Model for text-to-video is now in public GA, **Veo 2 Generate** (`veo-2.0-generate-001`)
- **For Veo > Advanced**
  - For **Image-to-video** (`veo-2.0-generate-001`) & advanced features (`veo-2.0-generate-exp`: interpolation, camera preset), you need to fill out [this form](https://docs.google.com/forms/d/e/1FAIpQLSciY6O_qGg2J0A8VUcK4egJ3_Tysh-wGTl-l218XtC0e7lM_w/viewform)

## 1\\ Create **Cloud Storage** buckets

- **Specifications:** Regional in your desired region (ex: `europe-west9` in Paris)
- **Create 3 buckets**
  - **Raw generated output content**: `YOUR_COMPANY-imgstudio-output`
  - **Shared content**: `YOUR_COMPANY-imgstudio-library`
  - **Configuration file bucket**: `YOUR_COMPANY-imgstudio-export-config`
    - Here upload `export-fields-options.json` a **configuration file specific** to your usage that you can find an [exemple](https://github.com/aduboue/img-studio/blob/main/export-fields-options.json) of in the [repository](https://github.com/aduboue/img-studio), its purpose is to setup the desired **metadata** you want to set for your generated content
    - In this file, for each **fields** (ex: contextAuthorTeam, contextTargetPlatform, contextAssociatedBrand, contextCollection), you can only change the **ID** of the field (ex: `“contextAuthorTeam”`), its **label** (ex: `“In which team are you?”`), its **name** (ex: `“Associated team(s)”`), its tag **isMandatory** (ex: `true`) and finally its **options**
    - Attention\! The ID and the options’ values must only be letters, no spaces, no special characters, starting with a lowercase letter

## 2\\ Setup **Cloud Build** trigger

- Name: `YOUR_COMPANY-imgstudio`
- **Event:** `Manual invocation`
- **Source:**
  - Go to the public repository [**https://github.com/aduboue/img-studio**](https://github.com/aduboue/img-studio)
  - **Monitor new releases** to stay up-to-date: click on `Watch` \> `Custom` \> `Releases` \> Apply
  - Use the top right button to setup a [**GitHub fork**](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) from the repository, which will **create a copy repository in your own GitHub account**
  - Back in Cloud Build, **log into your GitHub account**, then select the newly created repository
- **Configuration:** `Cloud Build configuration file (yaml or json)`
  - Cloud Build configuration file location: `/cloudbuild.yaml`
- Put in 7 **substitution variables:**

  - `_NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI`
    - The URI of the configuration JSON file in its bucket
    - Ex: `gs://YOUR_COMPANY-imgstudio-export-config/export-fields-options.json`
  - `_NEXT_PUBLIC_GCS_BUCKET_LOCATION`
    - The region selected for your GCS buckets
    - Ex: `europe-west9`
  - `_NEXT_PUBLIC_VERTEX_API_LOCATION`
    - The region you want to use for VertexAI APIs
    - Ex: `europe-west9`
  - `_NEXT_PUBLIC_GEMINI_MODEL` \= `gemini-2.0-flash-001`
    - Don’t change this
  - `_NEXT_PUBLIC_OUTPUT_BUCKET`
    - The name of the raw generated output content bucket
    - Ex: `YOUR_COMPANY-imgstudio-output`
  - `_NEXT_PUBLIC_TEAM_BUCKET`
    - The name of the shared content bucket
    - Ex: `YOUR_COMPANY-imgstudio-library`
  - `_NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS`
    - The sections of your users’ email address used to log in via IAP that will need to be removed in order to get their user ID, separated by commas
    - Ex: my email address is ‘admin-jdupont@company.com’, the value to set would be `admin-,@company.com` so that the user ID jdupont can be extracted
  - `_NEXT_PUBLIC_EDIT_ENABLED`
    - Allow to enable edit features, **set it to `false` if you do not have access yet**
  - `_NEXT_PUBLIC_SEG_MODEL`
    - **Only mandatory if Edit is enabled**
    - Service name for the Vertex Segmentation model, when you get access to it **(see Step 0\)**
  - `_NEXT_PUBLIC_VEO_ENABLED`
    - Allow to enable Veo text-to-video generation
  - `_NEXT_PUBLIC_VEO_ITV_ENABLED`
    - Allow to enable Veo image-to-video generation, **set it to `false` if you do not have access yet (see Step 0\)**
  - `_NEXT_PUBLIC_VEO_ADVANCED_ENABLED`
    - Allow to enable Veo advanced features (interpolation, camera preset), **set it to `false` if you do not have access yet (see Step 0\)**

- **Service account:** select the **default already existing Cloud Build service account** `PROJECT_NUMBER-compute@developer.gserviceaccount.com`
  - You may want to **check in IAM it has the roles**: `Artifact Registry Writer` and `Logs Writer`
- \> Save
- **Manualy run your first build \!**

## 3\\ Enable **IAP** & configure **oAuth Consent Screen**

- Go to **Security \> Identity Aware Proxy** and enable the API
- \> **Configure consent screen** (oAuth)
  - **User type** can be either
    - `Internal` if you want to limit IAP users to your **GCP org domain**
    - `External` if you have some users on a **different domain** than your GCP org’s
  - \> Create
  - Fill in
    - App Name: `YOUR_COMPANY-imgstudio`
    - User Support Email
    - Authorized Domain: `YOUR_COMPANY_DOMAIN`
    - Developer Contact Email
  - \> Save and Continue
- Add any needed **scopes** or \> Save and Continue
- Review the **Summary**
- \> Back to Dashboard

## 4\\ Create application **Service Account**

- Go to IAM \> Service Accounts \> Create Service Account
- Provide name: `YOUR_COMPANY-imgstudio-sa`
- Give **roles**:
  - `Cloud Datastore User`
  - `Logs Writer`
  - `Secret Manager Secret Accessor`
  - `Service Account Token Creator`
  - `Storage Object User`
  - `Vertex AI User`

## 5\\ Deploy **Cloud Run** service

- Deploy container \> Service
- `Deploy one revision from an existing container image`
- **Container image** \> Select from **Artifact registry** the `latest` image you just build in Cloud Build
- Name: `YOUR_COMPANY-imgstudio-app`
- Set your region (ex: `europe-west9`)
- **Authentication**: Require authentication
- **Ingress Control** \> `Internal` \> `Allow traffic from external Application Load Balancers`
- Container(s) **\> Container port:** `3000`
- Security **\> Service account:** `YOUR_COMPANY-imgstudio-sa`
- \> Create
- NB: if you try to access the published URL for the new service you should receive an error message stating “Error: Page Not Found”, this is due to the fact that we are only allowing ingress for external traffic from a Load Balancer

## 6\\ Grant IAP **Permissions** on Cloud Run service

- Create the **IAP service account address**
  - Go to the top right of the console \> Shell icon “Activate Cloud Shell”
  - Wait for machine to setup
  - In the terminal, use this command and **copy the output** service account address
    - `gcloud beta services identity create --service=iap.googleapis.com --project=PROJECT_ID`
  - The format of the output you can copy should be `service-PROJECT_NUMBER@gcp-sa-iap.iam.gserviceaccount.com`
- Go to Cloud Run, in the Services list, select the checkbox next to the name of your service
  - Click on **Permissions** \> **Add Principal**
  - Grant the `Cloud Run Invoker` role to the previously created/ fetched **IAP service account**

## 7\\ Create **DNS Zone**

- Network Service \> Cloud DNS
- \> Create zone
- Complete the form
  - Zone Name: `imgstudio`
  - **DNS Name**: `imgstudio.YOUR_COMPANY_DOMAIN`
  - DNSSEC: `Off`
  - Cloud Logging: `Off`
- Once DNS propagation is completed, verify the name servers of the DNS managed zone using the command below (it could take several hours to complete)
  - `dig imgstudio.YOUR_COMPANY_DOMAIN NS +short`

## 8\\ Create **Load Balancer** & **SSL Certificate**

- Network Service \> Load Balancing
- \> Create Load Balancer
- Select:
  - **Type of Load Balancer**: `Application Load Balancer (HTTP/HTTPS)`
  - **Public Facing or Internal**: `Public Facing (external)`
  - **Global or single region**: `Global`
  - **Load Balancer Generation**: `Global external Application Load Balancer`
- \> Configure
- Load balancer name: `YOUR_COMPANY-imgstudio-lb`
- Frontend configuration:
  - **Protocol**: `HTTPS`
  - **IP address** can be left `Ephemeral` (you could also configure a static IP)
  - **Certificate** dropdown \> Create a New Certificate
    - Name: `YOUR_COMPANY-imgstudio-cert`
    - \> Create Google-managed certificate
    - **Domain 1**: `imgstudio.YOUR_COMPANY_DOMAIN`
    - \> Create
  - \> Done
- Backend Configuration
  - Backend Services & Backend Buckets \> Create a **Backend Service**
  - Name: `YOUR_COMPANY-imgstudio-back`
  - **Backend type**: `Serverless Network Endpoint Group` \> Done
  - Backends \> New backend \> Serverless Network Endpoint Groups dropdown \> Create Serverless Network Endpoint Group
    - Name: `YOUR_COMPANY-imgstudio-neg`
    - Region: the region the Cloud Run service was deployed to (ex: `europe-west9`)
    - Serverless network endpoint group type \> Cloud Run \> Select service \> `YOUR_COMPANY-imgstudio-app` \> Create
    - Enable Cloud CDN \> `Off`
    - \> Create
- Review the Load Balancer configuration
- \> Create

## 9\\ Create **DNS Record** for Load Balancer frontend

- Network Services \> Load Balancing, select your load balancer `YOUR_COMPANY-imgstudio-lb`
- Details \> Frontend \> IP-Port
- Note the **IP address**
- Network Services \> Cloud DNS, select your DNS Zone `imgstudio`
- Record Sets \> Add Standard
- Create **record set**
  - DNS name: `imgstudio.YOUR_COMPANY_DOMAIN`
  - **IPv4 Address**: your load balancer IP Address
  - \> Create

## 10\\ Enable **IAP** & grant **user access**

- Security \> Identity-Aware Proxy
- Turn on **IAP** for your **backend service** `YOUR_COMPANY-imgstudio-back`
- Select the checkbox next to your service, then \> **Add** **Principal**
- Enter the address of the user (**or group**) you want to allow access to imgstudio
- Assign the role `IAP-secured Web App User`, \> Save

## 11\\ **Firestore** Database creation

- Firestore \> Create database
  - Firestore **mode**: `Native mode`, \> Continue
  - Database **ID**: `(default)` (**very important you keep it that way**)
  - Location type: `Region`
  - Region: your desired region (ex: `europe-west9` in Paris)
  - Secure rules: `Production rules`
- Firestore \> Indexes \> **Composite indexes** \> Create Index
  - **Collection ID**: `metadata`
  - **Fields to index**
    - Field path 1: `combinedFilters`, Index options 1: `Array contains`
    - Field path 2: `timestamp`, Index options 2: `Descending`
    - Field path 3: `__name__`, Index options 3: `Descending`
  - Query **scope**: `Collection`
  - \> Create
  - **Wait for the index to be successfully created\!**
- Let’s **setup security rules on your database**, and only allow your Cloud Run service account to access it
  - In a new tab, go to
    - `https://console.firebase.google.com/project/PROJECT_ID/firestore/databases/-default-/rules`
    - If necessary, follow the steps to **setup your Firebase project**
    - Once in Firestore Database \> Rules, go to the **security rules editor**
    - Write the following content, don’t forget to replace **`YOUR_COMPANY`** & **`PROJECT_ID`** in the Cloud Run service account
      `rules_version = '2';`
      `service cloud.firestore {`
      `match /databases/{database}/documents {`
      `match /{document=**} {`
      `allow read, get, list, create, update: if get(/databases/$(database)/documents/request.auth.uid).data.serviceAccount == 'YOUR_COMPANY-imgstudio-sa@PROJECT_ID.iam.gserviceaccount.com';`
      `allow delete: if false;`
      `}`
      `}`
      `}`
    - \> Publish

.

> ###### _This is not an officially supported Google product. This project is not eligible for the [Google Open Source Software Vulnerability Rewards Program](https://bughunters.google.com/open-source-security)._
