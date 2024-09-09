import { Roles } from '.';
export default [
  {
    title: 'Grammar correction',
    data: [
      {
        role: Roles.System,
        content:
          'You will be provided with statements, and your task is to convert them to standard English.'
      },
      {
        role: Roles.User,
        content: 'She no went to the market.'
      }
    ]
  },
  {
    title: 'Summarize for a 2nd grader',
    data: [
      {
        role: Roles.System,
        content:
          'Summarize content you are provided with for a second-grade student.'
      },
      {
        role: Roles.User,
        content:
          'Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined. Jupiter is one of the brightest objects visible to the naked eye in the night sky, and has been known to ancient civilizations since before recorded history. It is named after the Roman god Jupiter.[19] When viewed from Earth, Jupiter can be bright enough for its reflected light to cast visible shadows,[20] and is on average the third-brightest natural object in the night sky after the Moon and Venus.'
      }
    ]
  },
  {
    title: 'Keywords',
    data: [
      {
        role: Roles.System,
        content:
          'You will be provided with a block of text, and your task is to extract a list of keywords from it.'
      },
      {
        role: Roles.User,
        content:
          "Black-on-black ware is a 20th- and 21st-century pottery tradition developed by the Puebloan Native American ceramic artists in Northern New Mexico. Traditional reduction-fired blackware has been made for centuries by pueblo artists. Black-on-black ware of the past century is produced with a smooth surface, with the designs applied through selective burnishing or the application of refractory slip. Another style involves carving or incising designs and selectively polishing the raised areas. For generations several families from Kha'po Owingeh and P'ohwhóge Owingeh pueblos have been making black-on-black ware with the techniques passed down from matriarch potters. Artists from other pueblos have also produced black-on-black ware. Several contemporary artists have created works honoring the pottery of their ancestors."
      }
    ]
  },
  {
    title: 'Spreadsheet creator',
    data: [
      {
        role: Roles.User,
        content:
          'Create a two-column CSV of top science fiction movies along with the year of release.'
      }
    ]
  }
];
