var MENU = {
    "acai": [
        {
            "id": "acai-p",
            "img": "img/acai-tigela.png",
            "name": "Açaí - Tamanho P",
            "dsc": "P (Pequeno)",
            "price": 12.00
        },
        {
            "id": "acai-m",
            "img": "img/acai-tigela.png",
            "name": "Açaí - Tamanho M",
            "dsc": "M (Médio)",
            "price": 15.00
        },
        {
            "id": "acai-g",
            "img": "img/acai-tigela.png",
            "name": "Açaí - Tamanho G",
            "dsc": "G (Grande)",
            "price": 18.00
        },
        {
            "id": "acai-gg",
            "img": "img/acai-tigela.png",
            "name": "Açaí - Tamanho GG",
            "dsc": "GG",
            "price": 22.00
        },
        {
            "id": "acai-extrag",
            "img": "img/acai-tigela.png",
            "name": "Açaí - Tamanho Extra G",
            "dsc": "Extra G",
            "price": 25.00
        }
    ]
}

// Novas categorias: picolés, potes, sorvetes
MENU['picoles'] = [
    { id: 'picole-chocolate', img: 'https://via.placeholder.com/300x200?text=Picole+Chocolate', name: 'Picolé Chocolate', dsc: 'Unidade', price: 6.00, no_ingredients: true },
    { id: 'picole-fruta', img: 'https://via.placeholder.com/300x200?text=Picole+Fruta', name: 'Picolé Fruta', dsc: 'Unidade', price: 5.00, no_ingredients: true }
]

MENU['potes'] = [
    { id: 'pote-1l', img: 'https://via.placeholder.com/300x200?text=Pote+1L', name: 'Pote 1L', dsc: '1L', price: 45.00, no_ingredients: true },
    { id: 'pote-2l', img: 'https://via.placeholder.com/300x200?text=Pote+2L', name: 'Pote 2L', dsc: '2L', price: 85.00, no_ingredients: true }
]

MENU['sorvetes'] = [
    { id: 'sorvete-700', img: 'https://via.placeholder.com/300x200?text=Sorvete+700g', name: 'Monte Seu Sorvete 700g', dsc: '700g', price: 33.75, no_ingredients: true },
    { id: 'sorvete-1kg', img: 'https://via.placeholder.com/300x200?text=Sorvete+1kg', name: 'Monte Seu Sorvete 1kg', dsc: '1kg', price: 45.80, no_ingredients: true },
    { id: 'sorvete-500', img: 'https://via.placeholder.com/300x200?text=Sorvete+500g', name: 'Monte Seu Sorvete 500g', dsc: '500g', price: 22.89, no_ingredients: true },
    { id: 'sorvete-400', img: 'https://via.placeholder.com/300x200?text=Sorvete+400g', name: 'Monte Seu Sorvete 400g', dsc: '400g', price: 18.00, no_ingredients: true }
]

var INGREDIENTES = {
    "bases": [
        { "id": "base-acai", "name": "Açaí" },
        { "id": "base-creme-ninho", "name": "Creme de Ninho" },
        { "id": "base-acai-zero", "name": "Açaí Zero" },
        { "id": "base-pistache", "name": "Creme de Pistache" },
        { "id": "base-cupuacu", "name": "Cupuaçu" }
    ],
    "frutas": [
        { "id": "fruta-abacaxi", "name": "Abacaxi" },
        { "id": "fruta-banana", "name": "Banana" },
        { "id": "fruta-morango", "name": "Morango" },
        { "id": "fruta-manga", "name": "Manga" },
        { "id": "fruta-uva", "name": "Uva" }
    ],
    "coberturas": [
        { "id": "leite-condensado", "name": "Leite condensado" },
        { "id": "calda-chocolate", "name": "Calda de chocolate" },
        { "id": "calda-morango", "name": "Calda de morango" },
        { "id": "mel", "name": "Mel" },
        { "id": "brigadeiro", "name": "Brigadeiro" }
    ],
    "complementos": [
        { "id": "leite-po", "name": "Leite em pó" },
        { "id": "granola", "name": "Granola" },
        { "id": "pacoca", "name": "Paçoca" },
        { "id": "amendoim", "name": "Amendoim" },
        { "id": "castanha", "name": "Castanha" }
    ]
}
