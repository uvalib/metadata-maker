# MetadataMaker

Metadata Maker is a web application that is used for creating *good enough* quality metadata in four different formats depending on the needs of the system to which the metadata will be ingested. A live version of the tool hosted by the University of Virginia can be found at [https://staging.d8imevtfmovd7.amplifyapp.com/](https://staging.d8imevtfmovd7.amplifyapp.com/).

## Using MetadataMaker

Metadata Maker walks catalogers through 17 descriptive elements. Five elements must be supplied before records can be generated: **Title**, **Language**, **Number of pages (volumes)**, **Dimensions**, and **Keywords**. The remaining elements are optional, but the form provides an “Unlisted” checkbox when information is unavailable.

### Supported elements

| Element | Requirement |
| --- | --- |
| Title | Required |
| Subtitle | Optional |
| ISBN | Optional |
| Edition statement | Optional |
| Language | Required |
| Author | Required if available |
| Name of publisher | Optional |
| Place of publication | Optional |
| Country of publication | Optional |
| Date of publication | Optional |
| Copyright date | Optional |
| Number of pages (volumes) | Required |
| Dimensions | Required |
| Literature type | Optional |
| Illustration | Optional |
| Keywords | Required |
| Note to the Cataloger | Optional |

### Adding values

- Hover over the tooltip icon beside each element to see guidance on how to capture values from the item.
- Required elements display a red asterisk. The application will surface an error if they are missing.
- Optional elements include an **Unlisted** checkbox to signal unavailable data and bypass validation.
- Names support role selection (artist, author, contributor, editor, illustrator, translator). Use the **+** button to repeat Name and Keyword fields as needed.
- Language, Place of publication, Country/State/Province, publication dates, Keywords, and Literature type are driven by dropdowns. Keyword lookups use OCLC’s FAST vocabulary; selecting a FAST term saves both the heading and its FAST ID. Non-FAST keywords can still be entered manually.
- Title, Subtitle, Edition statement, Names, Name of publisher, and Place of publication fields support special character insertion. Use **Insert Special Characters** to pick characters from the palette.
- These same fields expose transliteration inputs automatically when non-Roman characters are supplied so that both the original script and transliterated values are captured.

### Generating metadata files

- Provide an optional record name; otherwise files default to `record`.
- Choose one or more output formats, then click **Make** to download the generated metadata to your workstation.
- The application retains entered values until you click **Clear**, making it easy to generate multiple formats from the same description.

### Open source

The complete source code lives in this repository. Forks and pull requests are welcome.

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (includes npm)

### Quick start

1. Install dependencies with `npm install`.
2. Start the live-reload dev server with `npm run dev` (serves on `http://localhost:3000` by default).
3. Set a custom port by running `PORT=8080 npm run dev` if the default is in use.

The command uses [`live-server`](https://www.npmjs.com/package/live-server) to serve the static files from the repository root and automatically reloads the browser when HTML, CSS, or JavaScript files change.

### Running tests

- Execute the unit test suite with `npm test`.
- Keep the watcher running during development with `npm run test:watch`.

### Deploying

- Run `npm run deploy` to sync static assets to the `metadata-maker` S3 bucket and trigger an AWS Amplify deployment for the `metadata-maker` app on the `staging` branch. The helper script packages the static files into an archive, uploads it with `aws amplify create-deployment`, and finalizes the publish with `aws amplify start-deployment`.
- Requirements: authenticated AWS CLI along with the `zip`, `curl`, `python3`, and `rsync` utilities available in your shell.

## Editing institution information

By default the records produced by MetadataMaker list the University of Virginia as the institution that created the records and "University of Virginia. Library" as the location of the physical holding. To change the default institution in code, edit the strings created in **`generateInstitutionInfo()`** in **`metadatamaker/submitForm.js`**. The institution information can also be customized by setting certain values in the URL. These values correspond to the variables in **`generateInstitutionInfo()`**:

- **marc** - corresponds to `output['marc']`
- **physicalLocation** - corresponds to `output['mods']['physicalLocation']`
- **recordContentSource** - corresponds to `output['mods']['recordContentSource']`
- **lcn** - organization's LC authority number, used to construct the url in `output['html']['url']`
- **n** - corresponds to `output['html']['name']`

A custom URL should look something like:

`https://staging.d8imevtfmovd7.amplifyapp.com/?marc=ViU&physicalLocation=University%20of%20Virginia%20Library&recordContentSource=ViU&lcn=n79127895&n=University%20of%20Virginia%20Library`
