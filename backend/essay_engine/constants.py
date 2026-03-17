from __future__ import annotations

COMPETENCIES = [
    {"id": 1, "name": "Competência 1", "label": "Norma padrão"},
    {"id": 2, "name": "Competência 2", "label": "Tema"},
    {"id": 3, "name": "Competência 3", "label": "Argumentação"},
    {"id": 4, "name": "Competência 4", "label": "Coesão"},
    {"id": 5, "name": "Competência 5", "label": "Intervenção"},
]

STOPWORDS = {
    "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
    "um", "uma", "uns", "umas", "para", "por", "com", "sem", "sobre", "entre", "que", "se",
    "ao", "aos", "à", "às", "como", "mais", "menos", "muito", "muita", "muitos", "muitas",
    "ser", "estar", "ter", "há", "isso", "essa", "esse", "essas", "esses", "sua", "seu",
    "suas", "seus", "são", "foi", "era", "pela", "pelo", "pelas", "pelos", "também", "já",
    "ainda", "quando", "onde", "porque", "pois", "num", "numa", "ele", "ela", "eles", "elas",
    "lhe", "lhes", "eu", "tu", "nós", "vocês", "você",
}

CONNECTIVES = [
    "além disso", "portanto", "assim", "desse modo", "nesse sentido", "sob essa ótica",
    "dessa forma", "contudo", "entretanto", "todavia", "porém", "logo", "outrossim",
    "em primeiro lugar", "em segundo lugar", "por conseguinte", "em síntese", "por fim", "ademais",
]

THESIS_MARKERS = [
    "é preciso", "é necessário", "é fundamental", "torna-se", "deve-se", "nota-se", "percebe-se",
]

CONCLUSION_MARKERS = [
    "portanto", "em síntese", "em suma", "por fim", "dessa forma", "desse modo", "assim",
]

INTERVENTION_AGENTS = [
    "governo", "estado", "escola", "familia", "sociedade", "ministerio", "midia", "ong",
    "instituicoes", "prefeitura",
]

INTERVENTION_ACTIONS = [
    "promover", "criar", "garantir", "oferecer", "ampliar", "investir", "fiscalizar",
    "desenvolver", "realizar", "implementar",
]

INTERVENTION_MEANS = [
    "por meio de", "mediante", "através de", "com campanhas", "com apoio", "em parceria",
    "por intermédio",
]

INTERVENTION_PURPOSES = [
    "para", "a fim de", "com o objetivo de", "visando",
]

INTERVENTION_DETAILS = [
    "nas escolas", "na mídia", "na internet", "nas redes sociais", "com acompanhamento",
    "com metas", "com periodicidade",
]

CAUSAL_MARKERS = [
    "porque", "pois", "já que", "uma vez que", "devido a", "em razão de", "por causa de", "visto que",
]

EXAMPLE_MARKERS = [
    "por exemplo", "como", "segundo", "de acordo com", "conforme", "a exemplo de", "isto é",
]

REPERTOIRE_MARKERS = [
    "constituicao federal", "direitos humanos", "declaracao universal", "ibge", "ipea", "onu", "unesco",
    "organizacao mundial da saude", "paulo freire", "zygmunt bauman", "milton santos", "sartre",
    "aristoteles", "platao", "durkheim", "foucault", "simone de beauvoir", "george orwell",
    "revolucao industrial", "idade media", "seculo xxi",
]

INFORMAL_MARKERS = [
    "vc", "vcs", "pq", "tbm", "ta", "to", "pra", "pro", "tipo", "mano", "né", "ne",
]
