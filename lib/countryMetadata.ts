export interface CountryMeta {
  region: string;
  trade_bloc: string;
  authority: string;
  industry: string;
}

export const COUNTRY_METADATA: Record<string, CountryMeta> = {
  "United States": {
    region: "North America",
    trade_bloc: "USMCA",
    authority: "U.S. Customs and Border Protection / Dept of State",
    industry: "Maritime, Defense, Trade, Security"
  },
  "United Kingdom": {
    region: "Europe",
    trade_bloc: "CPTPP",
    authority: "His Majesty's Revenue and Customs / Foreign Office",
    industry: "Maritime, Trade, Security, Human Rights"
  },
  "France": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Direction Générale des Douanes et Droits Indirects",
    industry: "Maritime, Defense, Diplomacy, Human Rights"
  },
  "Germany": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Bundeszollverwaltung (Federal Customs Service)",
    industry: "Trade, Environment, Defense, Human Rights"
  },
  "China": {
    region: "Asia-Pacific",
    trade_bloc: "RCEP",
    authority: "General Administration of Customs (GACC)",
    industry: "Trade, Maritime, Security, Environment"
  },
  "Japan": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "Japan Customs",
    industry: "Maritime, Trade, Environment, Security"
  },
  "Australia": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "Australian Border Force (ABF)",
    industry: "Maritime, Environment, Trade, Security"
  },
  "Israel": {
    region: "Middle East",
    trade_bloc: "None",
    authority: "Israel Customs Authority / Ministry of Foreign Affairs",
    industry: "Defense, Security, Human Rights, Diplomacy"
  },
  "Switzerland": {
    region: "Europe",
    trade_bloc: "EFTA",
    authority: "Federal Office for Customs and Border Security (FOCBS)",
    industry: "Diplomacy, Human Rights, Trade, Finance"
  },
  "Canada": {
    region: "North America",
    trade_bloc: "USMCA",
    authority: "Canada Border Services Agency (CBSA)",
    industry: "Maritime, Environment, Trade, Defense"
  },
  "Mexico": {
    region: "North America",
    trade_bloc: "USMCA",
    authority: "Agencia Nacional de Aduanas de México (ANAM)",
    industry: "Trade, Environment, Migration, Security"
  },
  "Brazil": {
    region: "Latin America",
    trade_bloc: "Mercosur",
    authority: "Receita Federal (Department of Federal Revenue)",
    industry: "Environment, Trade, Diplomacy, Human Rights"
  },
  "Argentina": {
    region: "Latin America",
    trade_bloc: "Mercosur",
    authority: "Dirección General de Aduanas (DGA)",
    industry: "Trade, Maritime, Human Rights, Diplomacy"
  },
  "South Africa": {
    region: "Africa",
    trade_bloc: "SACU",
    authority: "South African Revenue Service (SARS) - Customs",
    industry: "Diplomacy, Trade, Human Rights, Environment"
  },
  "Nigeria": {
    region: "Africa",
    trade_bloc: "ECOWAS",
    authority: "Nigeria Customs Service (NCS)",
    industry: "Trade, Security, Diplomacy"
  },
  "India": {
    region: "Asia-Pacific",
    trade_bloc: "SAFTA",
    authority: "Central Board of Indirect Taxes and Customs (CBIC)",
    industry: "Trade, Maritime, Environment, Defense, Diplomacy"
  },
  "Singapore": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "Singapore Customs",
    industry: "Trade, Maritime, Security, Finance"
  },
  "Belgium": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Administration des Douanes et Accises",
    industry: "Diplomacy, Human Rights, Trade"
  },
  "Netherlands": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Douane (Dutch Customs)",
    industry: "Maritime, Trade, Environment, Human Rights"
  },
  "New Zealand": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "New Zealand Customs Service",
    industry: "Environment, Maritime, Trade, Human Rights"
  },
  "Norway": {
    region: "Europe",
    trade_bloc: "EFTA",
    authority: "Norwegian Customs (Tolletaten)",
    industry: "Maritime, Environment, Energy, Diplomacy"
  },
  "Russia": {
    region: "Europe/Asia",
    trade_bloc: "EAEU",
    authority: "Federal Customs Service of Russia",
    industry: "Defense, Trade, Energy, Security"
  },
  "Spain": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Departamento de Aduanas e Impuestos Especiales",
    industry: "Maritime, Trade, Diplomacy, Human Rights"
  },
  "Italy": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Agenzia delle Accise, Dogane e Monopoli (ADM)",
    industry: "Maritime, Trade, Cultural Property, Diplomacy"
  },
  "Greece": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Independent Authority for Public Revenue (IAPR) - Customs",
    industry: "Maritime, Trade, Cultural Property"
  },
  "Turkey": {
    region: "Middle East/Europe",
    trade_bloc: "EU Customs Union",
    authority: "Ministry of Trade - Directorate General of Customs",
    industry: "Trade, Defense, Diplomacy, Security"
  },
  "South Korea": {
    region: "Asia-Pacific",
    trade_bloc: "RCEP",
    authority: "Korea Customs Service (KCS)",
    industry: "Trade, Maritime, Security, Defense"
  },
  "Egypt": {
    region: "Middle East/Africa",
    trade_bloc: "GAFTA",
    authority: "Egyptian Customs Authority",
    industry: "Suez Canal, Trade, Diplomacy, Security"
  },
  "Saudi Arabia": {
    region: "Middle East",
    trade_bloc: "GCC",
    authority: "Zakat, Tax and Customs Authority (ZATCA)",
    industry: "Energy, Trade, Security, Diplomacy"
  },
  "United Arab Emirates": {
    region: "Middle East",
    trade_bloc: "GCC",
    authority: "Federal Authority for Identity, Citizenship, Customs and Port Security",
    industry: "Trade, Maritime, Security, Finance"
  },
  "Colombia": {
    region: "Latin America",
    trade_bloc: "Pacific Alliance",
    authority: "Dirección de Impuestos y Aduanas Nacionales (DIAN)",
    industry: "Trade, Environment, Human Rights"
  },
  "Chile": {
    region: "Latin America",
    trade_bloc: "Pacific Alliance",
    authority: "Servicio Nacional de Aduanas",
    industry: "Trade, Maritime, Environment, Human Rights"
  },
  "Peru": {
    region: "Latin America",
    trade_bloc: "Pacific Alliance",
    authority: "Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT)",
    industry: "Trade, Environment, Human Rights"
  },
  "Universal": {
    region: "Global",
    trade_bloc: "None",
    authority: "United Nations / International Court of Justice",
    industry: "General public law, Human Rights, Dispute Resolution"
  },
  "NATO": {
    region: "Transatlantic",
    trade_bloc: "None",
    authority: "North Atlantic Council / Military Committee",
    industry: "Defense, Security, Military Operations"
  }
};
