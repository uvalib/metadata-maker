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
- Title, Subtitle, Edition statement, Names, Name of publisher, and Place of publication fields support diacritic insertion. Use **Insert Diacritics** to pick characters from the palette.
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

## Editing institution information

By default the records produced by MetadataMaker list the University of Virginia Library as the institution that created the records and as the location of the physical holding. To change the default institution in code, edit the strings created in **`generateInstitutionInfo()`** in **`metadatamaker/submitForm.js`**. The institution information can also be customized by setting certain values in the URL. These values correspond to the variables in **`generateInstitutionInfo()`**:

- **marc** - corresponds to `output['marc']`
- **physicalLocation** - corresponds to `output['mods']['physicalLocation']`
- **recordContentSource** - corresponds to `output['mods']['recordContentSource']`
- **lcn** - organization's LC authority number, used to construct the url in `output['html']['url']`
- **n** - corresponds to `output['html']['name']`

A custom URL should look something like:

`https://staging.d8imevtfmovd7.amplifyapp.com/?marc=ViU&physicalLocation=University%20of%20Virginia%20Library&recordContentSource=ViU&lcn=n79127895&n=University%20of%20Virginia%20Library`

## Updates

**02-06-2015:** Changed the Author field to be called Names, and created dropdown to define each name's role

**03-20-2015:** Keyword field now suggest FAST headings based on what the user has typed in the field. Uses OCLC's assignFAST web service. The Keyword field differentiates between FAST terms and non-FAST terms, and records each appropriately.

The file structure has been altered, placing the javascript files in subdirectories, and splitting marcmaker.js into more manageable chunks within the metadatamaker folder.

**04-17-2015:** FAST keywords now map to a number of different 6XX fields in MARC and MARCXML depending on how the keyword is categorized (e.g. personal name, corporate name, event, etc.), and may store portions of the keyword in different subfields. Keyword type classification is also implemented for MODS.

**04-21-2015:** Diacritics are now inserted at the cursor position

**08-21-2015:** The 008 field is now constructed as an array of individual strings, making it easy to change when you know the index that needs changing.

The information for the organization creating the record can be altered via the url. See the "Editing institution information" section above for more details.

**03-14-2023:** Folded the many branches into the default branch to make updating and deploying easier. The files from the other branches lack the development history, but the README for each page includes a link to the corresponding branch, which stores that history up until today.

**07-30-2024:** Added an npm-based development workflow with `live-server` for local development.

## Contact info

Comments and questions can be directed to Deren Kudeki and Myung-Ja Han at [mhan3@illinois.edu](mailto:mhan3@illinois.edu).
