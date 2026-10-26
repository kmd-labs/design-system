import { AboutText, TeamMember } from './about.model';

export const TEAM_MEMBERS: TeamMember[] = [
  {
    firstName: 'Adrian',
    lastName: 'Kulik',
    photo: 'assets/design-system/team/adrian-kulik.jpg',
    linkedin: 'https://www.linkedin.com/in/adrian-kulik',
    github: 'https://github.com/adriankulik'
  },
  {
    firstName: 'Leszek',
    lastName: 'Michalak',
    photo: 'assets/design-system/team/leszek-michalak.jpg',
    linkedin: 'https://www.linkedin.com/in/leszek-michalak-422745b6/'
  },
  {
    firstName: 'Marcin',
    lastName: 'Derewońko',
    photo: 'assets/design-system/team/marcin-derewonko.jpg',
    linkedin: 'https://linkedin.com/in/mmder'
  }
];

export const ABOUT_DICTS: Record<'en' | 'pl' | 'es', AboutText> = {
  en: {
    docTitle: 'About us – KMD Labs, interactive data visualisations',
    metaDescription: 'Meet KMD Labs, a team of three building interactive data visualisations: data engineering, machine learning, 3D graphics and cartography. Open to new projects.',
    cta: 'Open to new projects',
    contact: 'Contact',
    openAbout: 'About KMD',
    title: 'About us',
    kicker: 'laboratory',
    leads: [
      'kmd-labs is a three-person team that grew out of Viadrus AI, the first Polish team to win the European final of the CASSINI hackathon run by the European Union Agency for the Space Programme (EUSPA). Our winning solution used satellite data to detect leaks in water supply networks early.',
      'After the final we decided to pool the computing power of our grey matter. Each of us comes from a different field, but we are bound by a passion for geoinformatics and satellite data, as well as for anomaly detection, machine learning, software development and geovisualisation.',
      'Got data and no idea how to show it on a map or in space? Write to us!'
    ],
    refs: [
      {
        label: '11th CASSINI hackathon – EC report',
        href: 'https://defence-industry-space.ec.europa.eu/orbit-water-tap-11th-cassini-hackathon-2026-05-08_en',
        title: 'defence-industry-space.ec.europa.eu – From Orbit to the Water Tap: 11th CASSINI Hackathon',
        aria: 'European Commission report on the 11th CASSINI hackathon'
      },
      {
        label: 'CASSINI Hackathons – portfolio',
        href: 'https://www.cassini.eu/hackathons/portfolio',
        title: 'cassini.eu/hackathons/portfolio – Meet the Winners',
        aria: 'CASSINI Hackathons – portfolio of winning teams'
      },
      {
        label: 'kmd-labs on LinkedIn',
        href: 'https://www.linkedin.com/company/kmd-lab',
        title: 'linkedin.com/company/kmd-lab – kmd-labs',
        aria: 'kmd-labs company profile on LinkedIn'
      }
    ],
    back: 'Back to the globe',
    tasksLabel: 'Focus',
    photoSoon: 'Photo coming soon',
    linkedinAria: name => `LinkedIn profile – ${name}`,
    githubAria: name => `GitHub profile – ${name}`,
    footer: 'KMD · interactive data visualisation',
    people: [
      {
        bio: 'An environmental engineer by training and an AI engineer by choice. My adventure with code began in 2019 with three.js and generative art, which led to building my own augmented reality (AR) solutions. Today I focus on artificial intelligence and machine learning, connecting technology with solving real problems – as shown by winning the 11th edition of the CASSINI hackathon. Beyond coding I contribute to open source, play games, make music and take photos.',
        tasks: ['Fullstack development', '3D graphics', 'DevOps', 'UX/UI', 'Artificial intelligence', 'Machine learning']
      },
      {
        bio: 'Master of Administration from the University of Wrocław. Professionally I work as a data engineer at a large FMCG company. Besides managing databases I specialise in anomaly detection, data quality control and process automation. In the Viadrus AI project I brought the whole team together and was responsible for data acquisition. I worked with Marcin before at the same financial institution – as an intern I asked him a great many questions. I like proving that the impossible is possible after all. In my free time I photograph and paint landscapes and I am into maps and strategy games.',
        tasks: ['Data engineering', 'Machine learning', 'Data analytics', 'Data acquisition', 'Data quality']
      },
      {
        bio: 'I am a graduate of Marine Geography at the Faculty of Earth Sciences, University of Szczecin; of Geoinformation at the Faculty of Geographical and Geological Sciences, Adam Mickiewicz University in Poznań; and of Artificial Intelligence in Corporate Finance and Controlling at Kozminski University. For 12 years I have worked as a functional consultant for ERP-class systems. After hours I build systems that detect anomalies in financial and satellite data using machine learning. Creating geovisualisations is another great passion of mine. I have been developing my artificial intelligence skills for 4 years. I believe the future belongs to domain experts who can use AI effectively as a tool in their everyday work. Outside work I am into strength training, board games, Magic: The Gathering and gardening.',
        tasks: ['Geoinformatics', 'Geovisualisation', 'Anomaly detection', 'Machine learning', 'Artificial intelligence']
      }
    ]
  },
  pl: {
    docTitle: 'O nas – KMD Labs, interaktywne wizualizacje danych',
    metaDescription: 'Poznaj KMD Labs – trzyosobowy zespół tworzący interaktywne wizualizacje danych: inżynieria danych, uczenie maszynowe, grafika 3D i kartografia. Jesteśmy otwarci na projekty.',
    cta: 'Jesteśmy otwarci na projekty',
    contact: 'Kontakt',
    openAbout: 'O KMD',
    title: 'O nas',
    kicker: 'laboratory',
    leads: [
      'kmd-labs to trzyosobowy zespół wywodzący się z Viadrus AI, pierwszej polskiej drużyny, która wygrała europejski finał hackathonu CASSINI organizowanego przez Agencję Unii Europejskiej ds. Programu Kosmicznego (EUSPA). Nasze zwycięskie rozwiązanie wykorzystywało dane satelitarne do wczesnego wykrywania wycieków z sieci wodociągowych.',
      'Po finale postanowiliśmy połączyć moc obliczeniową naszych zwojów mózgowych. Każdy z nas przychodzi z innej dziedziny, ale łączy nas pasja do geoinformatyki i danych satelitarnych, a także do detekcji anomalii, uczenia maszynowego, tworzenia oprogramowania i geowizualizacji.',
      'Masz dane i nie wiesz, jak je pokazać na mapie albo w przestrzeni? Napisz do nas!'
    ],
    refs: [
      {
        label: '11. hackathon CASSINI – relacja KE',
        href: 'https://defence-industry-space.ec.europa.eu/orbit-water-tap-11th-cassini-hackathon-2026-05-08_en',
        title: 'defence-industry-space.ec.europa.eu – From Orbit to the Water Tap: 11th CASSINI Hackathon',
        aria: 'Relacja Komisji Europejskiej z 11. hackathonu CASSINI'
      },
      {
        label: 'CASSINI Hackathons – portfolio',
        href: 'https://www.cassini.eu/hackathons/portfolio',
        title: 'cassini.eu/hackathons/portfolio – Meet the Winners',
        aria: 'CASSINI Hackathons – portfolio zwycięskich zespołów'
      },
      {
        label: 'kmd-labs na LinkedIn',
        href: 'https://www.linkedin.com/company/kmd-lab',
        title: 'linkedin.com/company/kmd-lab – kmd-labs',
        aria: 'Profil firmowy kmd-labs na LinkedIn'
      }
    ],
    back: 'Wróć do globu',
    tasksLabel: 'Zadania',
    photoSoon: 'Zdjęcie wkrótce',
    linkedinAria: name => `Profil LinkedIn – ${name}`,
    githubAria: name => `Profil GitHub – ${name}`,
    footer: 'KMD · interaktywne wizualizacje danych',
    people: [
      {
        bio: 'Z wykształcenia magister inżynier środowiska, z wyboru AI Engineer. Moja przygoda z kodem zaczęła się w 2019 roku od three.js i sztuki generatywnej, co zaowocowało tworzeniem autorskich rozwiązań w AR (rzeczywistości rozszerzonej). Dziś skupiam się na sztucznej inteligencji i uczeniu maszynowym, łącząc technologię z realnym rozwiązywaniem problemów, czego dowodem jest zwycięstwo w 11. edycji hackathonu CASSINI. Poza kodowaniem działam w open source, gram, tworzę muzykę i fotografuję.',
        tasks: ['Programowanie fullstack', 'Grafika 3D', 'DevOps', 'UX/UI', 'Sztuczna inteligencja', 'Uczenie maszynowe']
      },
      {
        bio: 'Magister Administracji Uniwersytetu Wrocławskiego. Zawodowo pracuję jako Data Engineer w dużej firmie z branży FMCG. Oprócz zarządzania bazami danych specjalizuję się w wykrywaniu anomalii, kontroli jakości danych i automatyzacji procesów. W projekcie Viadrus AI zebrałem cały zespół i odpowiadałem za pozyskanie danych. Z Marcinem pracowałem wcześniej w tej samej instytucji finansowej – jako stażysta zadawałem mu bardzo dużo pytań. Lubię udowadniać, że niemożliwe jednak jest możliwe. W wolnym czasie fotografuję i maluję krajobrazy, interesuję się mapami i grami strategicznymi.',
        tasks: ['Inżynieria danych', 'Uczenie maszynowe', 'Analityka danych', 'Pozyskiwanie danych', 'Jakość danych']
      },
      {
        bio: 'Jestem absolwentem Geografii Morza na Wydziale Nauk o Ziemi Uniwersytetu Szczecińskiego, Geoinformacji na Wydziale Nauk Geograficznych i Geologicznych Uniwersytetu im. Adama Mickiewicza w Poznaniu oraz Sztucznej Inteligencji w Finansach i Controllingu Przedsiębiorstw na Akademii Leona Koźmińskiego. Od 12 lat pracuję jako konsultant funkcjonalny systemów klasy ERP. Po godzinach tworzę systemy do detekcji anomalii w danych finansowych i satelitarnych przy użyciu uczenia maszynowego. Moją wielką pasją jest również tworzenie geowizualizacji. Swoje umiejętności w zakresie sztucznej inteligencji rozwijam od 4 lat. Wierzę, że przyszłość należy do ekspertów domenowych, którzy potrafią skutecznie wykorzystywać AI jako narzędzie w swojej codziennej pracy. Prywatnie pasjonuję się treningiem siłowym, grami planszowymi, Magic: The Gathering oraz ogrodnictwem.',
        tasks: ['Geoinformatyka', 'Geowizualizacje', 'Detekcja anomalii', 'Uczenie maszynowe', 'Sztuczna inteligencja']
      }
    ]
  },
  es: {
    docTitle: 'Sobre nosotros – KMD Labs, visualizaciones interactivas de datos',
    metaDescription: 'Conoce a KMD Labs, un equipo de tres personas que crea visualizaciones interactivas de datos: ingeniería de datos, aprendizaje automático, gráficos 3D y cartografía. Abiertos a nuevos proyectos.',
    cta: 'Abiertos a nuevos proyectos',
    contact: 'Contacto',
    openAbout: 'Sobre KMD',
    title: 'Sobre nosotros',
    kicker: 'laboratory',
    leads: [
      'kmd-labs es un equipo de tres personas surgido de Viadrus AI, el primer equipo polaco que ganó la final europea del hackathon CASSINI organizado por la Agencia de la Unión Europea para el Programa Espacial (EUSPA). Nuestra solución ganadora empleaba datos satelitales para detectar de forma temprana fugas en las redes de abastecimiento de agua.',
      'Tras la final decidimos unir la capacidad de cálculo de nuestras neuronas. Cada uno viene de un ámbito distinto, pero nos une la pasión por la geoinformática y los datos satelitales, así como por la detección de anomalías, el aprendizaje automático, el desarrollo de software y la geovisualización.',
      '¿Tienes datos y no sabes cómo mostrarlos en un mapa o en el espacio? ¡Escríbenos!'
    ],
    refs: [
      {
        label: '11.º hackathon CASSINI – crónica de la CE',
        href: 'https://defence-industry-space.ec.europa.eu/orbit-water-tap-11th-cassini-hackathon-2026-05-08_en',
        title: 'defence-industry-space.ec.europa.eu – From Orbit to the Water Tap: 11th CASSINI Hackathon',
        aria: 'Crónica de la Comisión Europea sobre el 11.º hackathon CASSINI'
      },
      {
        label: 'CASSINI Hackathons – portafolio',
        href: 'https://www.cassini.eu/hackathons/portfolio',
        title: 'cassini.eu/hackathons/portfolio – Meet the Winners',
        aria: 'CASSINI Hackathons – portafolio de equipos ganadores'
      },
      {
        label: 'kmd-labs en LinkedIn',
        href: 'https://www.linkedin.com/company/kmd-lab',
        title: 'linkedin.com/company/kmd-lab – kmd-labs',
        aria: 'Perfil de empresa de kmd-labs en LinkedIn'
      }
    ],
    back: 'Volver al globo',
    tasksLabel: 'Áreas',
    photoSoon: 'Foto próximamente',
    linkedinAria: name => `Perfil de LinkedIn – ${name}`,
    githubAria: name => `Perfil de GitHub – ${name}`,
    footer: 'KMD · visualización interactiva de datos',
    people: [
      {
        bio: 'Ingeniero ambiental de formación e ingeniero de IA por elección. Mi aventura con el código empezó en 2019 con three.js y el arte generativo, lo que me llevó a crear mis propias soluciones de realidad aumentada (AR). Hoy me centro en la inteligencia artificial y el aprendizaje automático, uniendo la tecnología con la resolución de problemas reales, como demuestra la victoria en la 11.ª edición del hackathon CASSINI. Además de programar, participo en proyectos de código abierto, juego, hago música y fotografío.',
        tasks: ['Desarrollo fullstack', 'Gráficos 3D', 'DevOps', 'UX/UI', 'Inteligencia artificial', 'Aprendizaje automático']
      },
      {
        bio: 'Máster en Administración por la Universidad de Breslavia. Profesionalmente trabajo como ingeniero de datos en una gran empresa de gran consumo (FMCG). Además de gestionar bases de datos, me especializo en la detección de anomalías, el control de calidad de los datos y la automatización de procesos. En el proyecto Viadrus AI reuní a todo el equipo y me encargué de la obtención de datos. Antes trabajé con Marcin en la misma entidad financiera: como becario le hacía muchísimas preguntas. Me gusta demostrar que lo imposible sí es posible. En mi tiempo libre fotografío y pinto paisajes, y me interesan los mapas y los juegos de estrategia.',
        tasks: ['Ingeniería de datos', 'Aprendizaje automático', 'Analítica de datos', 'Obtención de datos', 'Calidad de datos']
      },
      {
        bio: 'Soy licenciado en Geografía Marina por la Facultad de Ciencias de la Tierra de la Universidad de Szczecin, en Geoinformación por la Facultad de Ciencias Geográficas y Geológicas de la Universidad Adam Mickiewicz de Poznań y en Inteligencia Artificial en Finanzas y Control de Gestión Empresarial por la Universidad Kozminski. Desde hace 12 años trabajo como consultor funcional de sistemas ERP. Fuera del horario laboral desarrollo sistemas de detección de anomalías en datos financieros y satelitales mediante aprendizaje automático. Crear geovisualizaciones es otra de mis grandes pasiones. Llevo 4 años desarrollando mis competencias en inteligencia artificial. Creo que el futuro pertenece a los expertos de dominio capaces de usar la IA con eficacia como herramienta en su trabajo diario. En lo personal me apasionan el entrenamiento de fuerza, los juegos de mesa, Magic: The Gathering y la jardinería.',
        tasks: ['Geoinformática', 'Geovisualización', 'Detección de anomalías', 'Aprendizaje automático', 'Inteligencia artificial']
      }
    ]
  }
};
