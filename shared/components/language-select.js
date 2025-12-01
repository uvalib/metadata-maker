import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';

class LanguageSelect extends LitElement {
  static properties = {
    heading: { type: String },
    fieldId: { type: String, attribute: 'field-id' },
    containerId: { type: String, attribute: 'container-id' },
    containerClass: { type: String, attribute: 'container-class' },
    selectClass: { type: String, attribute: 'select-class' },
    required: { type: Boolean, reflect: true },
    requiredMarker: { type: String, attribute: 'required-marker' },
    value: { type: String },
    name: { type: String },
    showHeading: { type: Boolean, attribute: 'show-heading' }
  };

  constructor() {
    super();
    this.heading = 'Language';
    this.fieldId = 'language';
    this.containerId = 'language-block';
    this.containerClass = 'standard-block';
    this.selectClass = '';
    this.required = false;
    this.requiredMarker = '*';
    this.value = '';
    this.name = '';
    this.showHeading = true;
    this._formResetHandler = null;
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    const form = this.closest('form');
    if (form) {
      this._formResetHandler = () => {
        this.value = '';
      };
      form.addEventListener('reset', this._formResetHandler);
    }
  }

  disconnectedCallback() {
    const form = this.closest('form');
    if (form && this._formResetHandler) {
      form.removeEventListener('reset', this._formResetHandler);
    }
    super.disconnectedCallback();
  }

  render() {
    const blockId = this.containerId || `${this.fieldId}-block`;
    const initialClasses = this.selectClass ? this.selectClass.split(/\s+/).filter((part) => part && part.length > 0) : [];
    const hasRequiredClass = initialClasses.includes('required');
    const hasConditionalClass = initialClasses.includes('conditional');
    if (this.required && !hasRequiredClass) {
      initialClasses.push('required');
    } else if (!this.required && !hasConditionalClass) {
      initialClasses.push('conditional');
    }
    const selectClasses = initialClasses.join(' ').trim();
    const nameAttr = this.name && this.name.length > 0 ? this.name : this.fieldId;
    const headingTemplate = this.showHeading
      ? html`<label for="${this.fieldId}" class="block text-sm font-medium leading-6 text-gray-900 mb-2">
          ${this.heading}${this.required ? html`<span class="required_marker ml-1 text-red-500">${this.requiredMarker}</span>` : nothing}
        </label>`
      : nothing;

    return html`
      <div id=${blockId} class=${this.containerClass}>
        ${headingTemplate}
        <select
          name="${nameAttr}"
          id="${this.fieldId}"
          class="${selectClasses} block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
          ?required=${this.required}
          .value=${this.value ?? ''}
          @change=${this._handleChange}
        >
          <option selected disabled hidden value=''></option>
          <option value="abk">Abkhaz</option>
          <option value="ace">Achinese</option>
          <option value="ach">Acoli</option>
          <option value="ada">Adangme</option>
          <option value="ady">Adygei</option>
          <option value="aar">Afar</option>
          <option value="afh">Afrihili (Artificial language)</option>
          <option value="afr">Afrikaans</option>
          <option value="afa">Afroasiatic (Other)</option>
          <option value="ain">Ainu</option>
          <option value="aka">Akan</option>
          <option value="akk">Akkadian</option>
          <option value="alb">Albanian</option>
          <option value="ale">Aleut</option>
          <option value="alg">Algonquian (Other)</option>
          <option value="alt">Altai</option>
          <option value="tut">Altaic (Other)</option>
          <option value="amh">Amharic</option>
          <option value="anp">Angika</option>
          <option value="apa">Apache languages</option>
          <option value="ara">Arabic</option>
          <option value="arg">Aragonese</option>
          <option value="arc">Aramaic</option>
          <option value="arp">Arapaho</option>
          <option value="arw">Arawak</option>
          <option value="arm">Armenian</option>
          <option value="rup">Aromanian</option>
          <option value="art">Artificial (Other)</option>
          <option value="asm">Assamese</option>
          <option value="ath">Athapascan (Other)</option>
          <option value="aus">Australian languages</option>
          <option value="map">Austronesian (Other)</option>
          <option value="ava">Avaric</option>
          <option value="ave">Avestan</option>
          <option value="awa">Awadhi</option>
          <option value="aym">Aymara</option>
          <option value="aze">Azerbaijani</option>
          <option value="ast">Bable</option>
          <option value="ban">Balinese</option>
          <option value="bat">Baltic (Other)</option>
          <option value="bal">Baluchi</option>
          <option value="bam">Bambara</option>
          <option value="bai">Bamileke languages</option>
          <option value="bad">Banda languages</option>
          <option value="bnt">Bantu (Other)</option>
          <option value="bas">Basa</option>
          <option value="bak">Bashkir</option>
          <option value="baq">Basque</option>
          <option value="btk">Batak</option>
          <option value="bej">Beja</option>
          <option value="bel">Belarusian</option>
          <option value="bem">Bemba</option>
          <option value="ben">Bengali</option>
          <option value="ber">Berber (Other)</option>
          <option value="bho">Bhojpuri</option>
          <option value="bih">Bihari (Other)</option>
          <option value="bik">Bikol</option>
          <option value="byn">Bilin</option>
          <option value="bis">Bislama</option>
          <option value="zbl">Blissymbolics</option>
          <option value="bos">Bosnian</option>
          <option value="bra">Braj</option>
          <option value="bre">Breton</option>
          <option value="bug">Bugis</option>
          <option value="bul">Bulgarian</option>
          <option value="bua">Buriat</option>
          <option value="bur">Burmese</option>
          <option value="cad">Caddo</option>
          <option value="car">Carib</option>
          <option value="cat">Catalan</option>
          <option value="cau">Caucasian (Other)</option>
          <option value="ceb">Cebuano</option>
          <option value="cel">Celtic (Other)</option>
          <option value="cai">Central American Indian (Other)</option>
          <option value="chg">Chagatai</option>
          <option value="cmc">Chamic languages</option>
          <option value="cha">Chamorro</option>
          <option value="che">Chechen</option>
          <option value="chr">Cherokee</option>
          <option value="chy">Cheyenne</option>
          <option value="chb">Chibcha</option>
          <option value="chi">Chinese</option>
          <option value="chn">Chinook jargon</option>
          <option value="chp">Chipewyan</option>
          <option value="cho">Choctaw</option>
          <option value="chu">Church Slavic</option>
          <option value="chk">Chuukese</option>
          <option value="chv">Chuvash</option>
          <option value="cop">Coptic</option>
          <option value="cor">Cornish</option>
          <option value="cos">Corsican</option>
          <option value="cre">Cree</option>
          <option value="mus">Creek</option>
          <option value="crp">Creoles and Pidgins (Other)</option>
          <option value="cpe">Creoles and Pidgins, English-based (Other)</option>
          <option value="cpf">Creoles and Pidgins, French-based (Other)</option>
          <option value="cpp">Creoles and Pidgins, Portuguese-based (Other)</option>
          <option value="crh">Crimean Tatar</option>
          <option value="hrv">Croatian</option>
          <option value="cus">Cushitic (Other)</option>
          <option value="cze">Czech</option>
          <option value="dak">Dakota</option>
          <option value="dan">Danish</option>
          <option value="dar">Dargwa</option>
          <option value="day">Dayak</option>
          <option value="del">Delaware</option>
          <option value="din">Dinka</option>
          <option value="div">Divehi</option>
          <option value="doi">Dogri</option>
          <option value="dgr">Dogrib</option>
          <option value="dra">Dravidian (Other)</option>
          <option value="dua">Duala</option>
          <option value="dut">Dutch</option>
          <option value="dum">Dutch, Middle (ca. 1050-1350)</option>
          <option value="dyu">Dyula</option>
          <option value="dzo">Dzongkha</option>
          <option value="frs">East Frisian</option>
          <option value="bin">Edo</option>
          <option value="efi">Efik</option>
          <option value="egy">Egyptian</option>
          <option value="eka">Ekajuk</option>
          <option value="elx">Elamite</option>
          <option value="eng">English</option>
          <option value="enm">English, Middle (1100-1500)</option>
          <option value="ang">English, Old (ca. 450-1100)</option>
          <option value="myv">Erzya</option>
          <option value="epo">Esperanto</option>
          <option value="est">Estonian</option>
          <option value="gez">Ethiopic</option>
          <option value="ewe">Ewe</option>
          <option value="ewo">Ewondo</option>
          <option value="fan">Fang</option>
          <option value="fat">Fanti</option>
          <option value="fao">Faroese</option>
          <option value="fij">Fijian</option>
          <option value="fil">Filipino</option>
          <option value="fin">Finnish</option>
          <option value="fiu">Finno-Ugrian (Other)</option>
          <option value="fon">Fon</option>
          <option value="fre">French</option>
          <option value="frm">French, Middle (ca. 1300-1600)</option>
          <option value="fro">French, Old (ca. 842-1300)</option>
          <option value="fry">Frisian</option>
          <option value="fur">Friulian</option>
          <option value="ful">Fula</option>
          <option value="gaa">Gã</option>
          <option value="glg">Galician</option>
          <option value="lug">Ganda</option>
          <option value="gay">Gayo</option>
          <option value="gba">Gbaya</option>
          <option value="geo">Georgian</option>
          <option value="ger">German</option>
          <option value="gmh">German, Middle High (ca. 1050-1500)</option>
          <option value="goh">German, Old High (ca. 750-1050)</option>
          <option value="gem">Germanic (Other)</option>
          <option value="gil">Gilbertese</option>
          <option value="gon">Gondi</option>
          <option value="gor">Gorontalo</option>
          <option value="got">Gothic</option>
          <option value="grb">Grebo</option>
          <option value="grc">Greek, Ancient (to 1453)</option>
          <option value="gre">Greek, Modern (1453-)</option>
          <option value="grn">Guarani</option>
          <option value="guj">Gujarati</option>
          <option value="gwi">Gwich'in</option>
          <option value="hai">Haida</option>
          <option value="hat">Haitian French Creole</option>
          <option value="hau">Hausa</option>
          <option value="haw">Hawaiian</option>
          <option value="heb">Hebrew</option>
          <option value="her">Herero</option>
          <option value="hil">Hiligaynon</option>
          <option value="hin">Hindi</option>
          <option value="hmo">Hiri Motu</option>
          <option value="hit">Hittite</option>
          <option value="hmn">Hmong</option>
          <option value="hun">Hungarian</option>
          <option value="hup">Hupa</option>
          <option value="iba">Iban</option>
          <option value="ice">Icelandic</option>
          <option value="ido">Ido</option>
          <option value="ibo">Igbo</option>
          <option value="ijo">Ijo</option>
          <option value="ilo">Iloko</option>
          <option value="smn">Inari Sami</option>
          <option value="inc">Indic (Other)</option>
          <option value="ine">Indo-European (Other)</option>
          <option value="ind">Indonesian</option>
          <option value="inh">Ingush</option>
          <option value="ina">Interlingua (International Auxiliary Language Association)</option>
          <option value="ile">Interlingue</option>
          <option value="iku">Inuktitut</option>
          <option value="ipk">Inupiaq</option>
          <option value="ira">Iranian (Other)</option>
          <option value="gle">Irish</option>
          <option value="mga">Irish, Middle (ca. 1100-1550)</option>
          <option value="sga">Irish, Old (to 1100)</option>
          <option value="iro">Iroquoian (Other)</option>
          <option value="ita">Italian</option>
          <option value="jpn">Japanese</option>
          <option value="jav">Javanese</option>
          <option value="jrb">Judeo-Arabic</option>
          <option value="jpr">Judeo-Persian</option>
          <option value="kbd">Kabardian</option>
          <option value="kab">Kabyle</option>
          <option value="kac">Kachin</option>
          <option value="kal">Kalâtdlisut</option>
          <option value="kam">Kamba</option>
          <option value="kan">Kannada</option>
          <option value="kau">Kanuri</option>
          <option value="kaa">Kara-Kalpak</option>
          <option value="krc">Karachay-Balkar</option>
          <option value="krl">Karelian</option>
          <option value="kar">Karen languages</option>
          <option value="kas">Kashmiri</option>
          <option value="csb">Kashubian</option>
          <option value="kaw">Kawi</option>
          <option value="kaz">Kazakh</option>
          <option value="kha">Khasi</option>
          <option value="khm">Khmer</option>
          <option value="khi">Khoisan (Other)</option>
          <option value="kho">Khotanese</option>
          <option value="kik">Kikuyu</option>
          <option value="kmb">Kimbundu</option>
          <option value="kin">Kinyarwanda</option>
          <option value="tlh">Klingon (Artificial language)</option>
          <option value="kom">Komi</option>
          <option value="kon">Kongo</option>
          <option value="kok">Konkani</option>
          <option value="kut">Kootenai</option>
          <option value="kor">Korean</option>
          <option value="kos">Kosraean</option>
          <option value="kpe">Kpelle</option>
          <option value="kro">Kru (Other)</option>
          <option value="kua">Kuanyama</option>
          <option value="kum">Kumyk</option>
          <option value="kur">Kurdish</option>
          <option value="kru">Kurukh</option>
          <option value="kir">Kyrgyz</option>
          <option value="lad">Ladino</option>
          <option value="lah">Lahndā</option>
          <option value="lam">Lamba (Zambia and Congo)</option>
          <option value="lao">Lao</option>
          <option value="lat">Latin</option>
          <option value="lav">Latvian</option>
          <option value="lez">Lezgian</option>
          <option value="lim">Limburgish</option>
          <option value="lin">Lingala</option>
          <option value="lit">Lithuanian</option>
          <option value="jbo">Lojban (Artificial language)</option>
          <option value="nds">Low German</option>
          <option value="dsb">Lower Sorbian</option>
          <option value="loz">Lozi</option>
          <option value="lub">Luba-Katanga</option>
          <option value="lua">Luba-Lulua</option>
          <option value="lui">Luiseño</option>
          <option value="smj">Lule Sami</option>
          <option value="lun">Lunda</option>
          <option value="luo">Luo (Kenya and Tanzania)</option>
          <option value="lus">Lushai</option>
          <option value="ltz">Luxembourgish</option>
          <option value="mas">Maasai</option>
          <option value="mac">Macedonian</option>
          <option value="mad">Madurese</option>
          <option value="mag">Magahi</option>
          <option value="mai">Maithili</option>
          <option value="mak">Makasar</option>
          <option value="mlg">Malagasy</option>
          <option value="may">Malay</option>
          <option value="mal">Malayalam</option>
          <option value="mlt">Maltese</option>
          <option value="mnc">Manchu</option>
          <option value="mdr">Mandar</option>
          <option value="man">Mandingo</option>
          <option value="mni">Manipuri</option>
          <option value="mno">Manobo languages</option>
          <option value="glv">Manx</option>
          <option value="mao">Maori</option>
          <option value="arn">Mapuche</option>
          <option value="mar">Marathi</option>
          <option value="chm">Mari</option>
          <option value="mah">Marshallese</option>
          <option value="mwr">Marwari</option>
          <option value="myn">Mayan languages</option>
          <option value="men">Mende</option>
          <option value="mic">Micmac</option>
          <option value="min">Minangkabau</option>
          <option value="mwl">Mirandese</option>
          <option value="mis">Miscellaneous languages</option>
          <option value="moh">Mohawk</option>
          <option value="mdf">Moksha</option>
          <option value="mkh">Mon-Khmer (Other)</option>
          <option value="lol">Mongo-Nkundu</option>
          <option value="mon">Mongolian</option>
          <option value="mos">Mooré</option>
          <option value="mul">Multiple languages</option>
          <option value="mun">Munda (Other)</option>
          <option value="nqo">N'Ko</option>
          <option value="nah">Nahuatl</option>
          <option value="nau">Nauru</option>
          <option value="nav">Navajo</option>
          <option value="nbl">Ndebele (South Africa)</option>
          <option value="nde">Ndebele (Zimbabwe)</option>
          <option value="ndo">Ndonga</option>
          <option value="nap">Neapolitan Italian</option>
          <option value="nep">Nepali</option>
          <option value="new">Newari</option>
          <option value="nwc">Newari, Old</option>
          <option value="nia">Nias</option>
          <option value="nic">Niger-Kordofanian (Other)</option>
          <option value="ssa">Nilo-Saharan (Other)</option>
          <option value="niu">Niuean</option>
          <option value="zxx">No linguistic content</option>
          <option value="nog">Nogai</option>
          <option value="nai">North American Indian (Other)</option>
          <option value="frr">North Frisian</option>
          <option value="sme">Northern Sami</option>
          <option value="nso">Northern Sotho</option>
          <option value="nor">Norwegian</option>
          <option value="nob">Norwegian (Bokmål)</option>
          <option value="nno">Norwegian (Nynorsk)</option>
          <option value="nub">Nubian languages</option>
          <option value="nym">Nyamwezi</option>
          <option value="nya">Nyanja</option>
          <option value="nyn">Nyankole</option>
          <option value="nyo">Nyoro</option>
          <option value="nzi">Nzima</option>
          <option value="oci">Occitan (post-1500)</option>
          <option value="xal">Oirat</option>
          <option value="oji">Ojibwa</option>
          <option value="non">Old Norse</option>
          <option value="peo">Old Persian (ca. 600-400 B.C.)</option>
          <option value="ori">Oriya</option>
          <option value="orm">Oromo</option>
          <option value="osa">Osage</option>
          <option value="oss">Ossetic</option>
          <option value="oto">Otomian languages</option>
          <option value="pal">Pahlavi</option>
          <option value="pau">Palauan</option>
          <option value="pli">Pali</option>
          <option value="pam">Pampanga</option>
          <option value="pag">Pangasinan</option>
          <option value="pan">Panjabi</option>
          <option value="pap">Papiamento</option>
          <option value="paa">Papuan (Other)</option>
          <option value="per">Persian</option>
          <option value="phi">Philippine (Other)</option>
          <option value="phn">Phoenician</option>
          <option value="pon">Pohnpeian</option>
          <option value="pol">Polish</option>
          <option value="por">Portuguese</option>
          <option value="pra">Prakrit languages</option>
          <option value="pro">Provençal (to 1500)</option>
          <option value="pus">Pushto</option>
          <option value="que">Quechua</option>
          <option value="roh">Raeto-Romance</option>
          <option value="raj">Rajasthani</option>
          <option value="rap">Rapanui</option>
          <option value="rar">Rarotongan</option>
          <option value="roa">Romance (Other)</option>
          <option value="rom">Romani</option>
          <option value="rum">Romanian</option>
          <option value="run">Rundi</option>
          <option value="rus">Russian</option>
          <option value="sal">Salishan languages</option>
          <option value="sam">Samaritan Aramaic</option>
          <option value="smi">Sami</option>
          <option value="smo">Samoan</option>
          <option value="sad">Sandawe</option>
          <option value="sag">Sango (Ubangi Creole)</option>
          <option value="san">Sanskrit</option>
          <option value="sat">Santali</option>
          <option value="srd">Sardinian</option>
          <option value="sas">Sasak</option>
          <option value="sco">Scots</option>
          <option value="gla">Scottish Gaelic</option>
          <option value="sel">Selkup</option>
          <option value="sem">Semitic (Other)</option>
          <option value="srp">Serbian</option>
          <option value="srr">Serer</option>
          <option value="shn">Shan</option>
          <option value="sna">Shona</option>
          <option value="iii">Sichuan Yi</option>
          <option value="scn">Sicilian Italian</option>
          <option value="sid">Sidamo</option>
          <option value="sgn">Sign languages</option>
          <option value="bla">Siksika</option>
          <option value="snd">Sindhi</option>
          <option value="sin">Sinhalese</option>
          <option value="sit">Sino-Tibetan (Other)</option>
          <option value="sio">Siouan (Other)</option>
          <option value="sms">Skolt Sami</option>
          <option value="den">Slavey</option>
          <option value="sla">Slavic (Other)</option>
          <option value="slo">Slovak</option>
          <option value="slv">Slovenian</option>
          <option value="sog">Sogdian</option>
          <option value="som">Somali</option>
          <option value="son">Songhai</option>
          <option value="snk">Soninke</option>
          <option value="wen">Sorbian (Other)</option>
          <option value="sot">Sotho</option>
          <option value="sai">South American Indian (Other)</option>
          <option value="sma">Southern Sami</option>
          <option value="spa">Spanish</option>
          <option value="srn">Sranan</option>
          <option value="suk">Sukuma</option>
          <option value="sux">Sumerian</option>
          <option value="sun">Sundanese</option>
          <option value="sus">Susu</option>
          <option value="swa">Swahili</option>
          <option value="ssw">Swazi</option>
          <option value="swe">Swedish</option>
          <option value="gsw">Swiss German</option>
          <option value="syc">Syriac</option>
          <option value="syr">Syriac, Modern</option>
          <option value="tgl">Tagalog</option>
          <option value="tah">Tahitian</option>
          <option value="tai">Tai (Other)</option>
          <option value="tgk">Tajik</option>
          <option value="tmh">Tamashek</option>
          <option value="tam">Tamil</option>
          <option value="tat">Tatar</option>
          <option value="tel">Telugu</option>
          <option value="tem">Temne</option>
          <option value="ter">Terena</option>
          <option value="tet">Tetum</option>
          <option value="tha">Thai</option>
          <option value="tib">Tibetan</option>
          <option value="tig">Tigré</option>
          <option value="tir">Tigrinya</option>
          <option value="tiv">Tiv</option>
          <option value="tli">Tlingit</option>
          <option value="tpi">Tok Pisin</option>
          <option value="tkl">Tokelauan</option>
          <option value="tog">Tonga (Nyasa)</option>
          <option value="ton">Tongan</option>
          <option value="tsi">Tsimshian</option>
          <option value="tso">Tsonga</option>
          <option value="tsn">Tswana</option>
          <option value="tum">Tumbuka</option>
          <option value="tup">Tupi languages</option>
          <option value="tur">Turkish</option>
          <option value="ota">Turkish, Ottoman</option>
          <option value="tuk">Turkmen</option>
          <option value="tvl">Tuvaluan</option>
          <option value="tyv">Tuvinian</option>
          <option value="twi">Twi</option>
          <option value="udm">Udmurt</option>
          <option value="uga">Ugaritic</option>
          <option value="uig">Uighur</option>
          <option value="ukr">Ukrainian</option>
          <option value="umb">Umbundu</option>
          <option value="und">Undetermined</option>
          <option value="hsb">Upper Sorbian</option>
          <option value="urd">Urdu</option>
          <option value="uzb">Uzbek</option>
          <option value="vai">Vai</option>
          <option value="ven">Venda</option>
          <option value="vie">Vietnamese</option>
          <option value="vol">Volapük</option>
          <option value="vot">Votic</option>
          <option value="wak">Wakashan languages</option>
          <option value="wln">Walloon</option>
          <option value="war">Waray</option>
          <option value="was">Washoe</option>
          <option value="wel">Welsh</option>
          <option value="him">Western Pahari languages</option>
          <option value="wal">Wolayta</option>
          <option value="wol">Wolof</option>
          <option value="xho">Xhosa</option>
          <option value="sah">Yakut</option>
          <option value="yao">Yao (Africa)</option>
          <option value="yap">Yapese</option>
          <option value="yid">Yiddish</option>
          <option value="yor">Yoruba</option>
          <option value="ypk">Yupik languages</option>
          <option value="znd">Zande languages</option>
          <option value="zap">Zapotec</option>
          <option value="zza">Zaza</option>
          <option value="zen">Zenaga</option>
          <option value="zha">Zhuang</option>
          <option value="zul">Zulu</option>
          <option value="zun">Zuni</option>
        </select>
      </div>
    `;
  }

  _handleChange(event) {
    this.value = event && event.target ? event.target.value : '';
  }

  updated(changedProps) {
    if (changedProps.has('value')) {
      const select = this.querySelector('select');
      if (select && select.value !== (this.value ?? '')) {
        select.value = this.value ?? '';
      }
    }
  }
}

customElements.define('language-select', LanguageSelect);
