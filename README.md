# Infrastructure setup guide for ImgStudio

## 1\\ Create **Cloud Storage** buckets

- **Specifications:** Regional in your desired region (ex: `europe-west9` in Paris)
- **Create 3 buckets**
  - **Raw generated output content**: `YOUR_COMPANY-imgstudio-output`
  - **Shared content**: `YOUR_COMPANY-imgstudio-library`
  - **Configuration file bucket**: `YOUR_COMPANY-imgstudio-export-config`
    - Here upload `export-fields-options.json` a **configuration file specific** to your usage that you can find an [exemple](https://github.com/aduboue/img-studio/blob/main/export-fields-options.json) of in the [repository](https://github.com/aduboue/img-studio), its purpose is to setup the desired **metadata** you want to set for your generated content
    - In this file, for each **fields** (ex: contextAuthorTeam, contextTargetPlatform, contextAssociatedBrand, contextCollection), you can only change the **ID** of the field (ex: `“contextAuthorTeam”`), it’s **label** (ex: `“In which team are you?”`), it’s **name** (ex: `“Associated team(s)”`), it’s tag **isMandatory** (ex: `true`) and finally it’s **options**
    - Attention\! The ID and the options’ values must only be letters, no spaces, no special characters, starting with a lowercase letter

## 2\\ Setup **Cloud Build** trigger

- Name: `YOUR_COMPANY-imgstudio`
- **Event:** `Manual invocation`
- **Source:** [https://github.com/aduboue/img-studio](https://github.com/aduboue/img-studio)
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
  - `_NEXT_PUBLIC_GEMINI_MODEL` \= `gemini-1.5-flash-001`
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
- \> Save
- **Mannualy run your first build \!**

## 3\\ Enable **IAP** & configure **oAuth Consent Screen**

- Go to **Security \> Identity Aware Proxy** and enable the API
- \> **Configure consent screen** (oAuth)
  - **User type**: `Internal`
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
  - `Storage Object Creator`
  - `Storage Object Viewer`
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
- _NB: if you try to access the published URL for the new service you should receive an error message stating “Error: Page Not Found”, this is due to the fact that we are only allowing ingress for external traffic from a Load Balancer_

## 6\\ Grant **Permissions** on Cloud Run service

- From the Cloud Run Services list, select the checkbox next to the name of your service, then \> **Permissions**
- \> **Add Principal**
- Grant the `Cloud Run Invoker` role to the **IAP service account** `service-PROJECT_NUMBER@gcp-sa-iap.iam.gserviceaccount.com` (you project number can be found in the console \> Cloud Overview \> Dashboard)

## 7\\ Create **DNS Zone**

- Network Service \> Cloud DNS
- \> Create zone
- Complete the form
  - Zone Name: `imgstudio`
  - **DNS Name**: `imgstudio.YOUR_COMPANY_DOMAIN`
  - DNSSEC: `off`
  - Cloud Logging: `off`
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

- Your application should be configured to automatically create the **default Firestore database** for metadata upon the first deployment or access
