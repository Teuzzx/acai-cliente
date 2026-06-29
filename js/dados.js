var MENU = {
    "acai": [
        {
            "id": "acai-200g",
            "img": "img/acai-tigela.png",
            "name": "Açaí no Pote 200g",
            "dsc": "200g",
            "price": 12.00,
            "no_ingredients": true
        },
        {
            "id": "acai-300g",
            "img": "img/acai-tigela.png",
            "name": "Açaí no Pote 300g",
            "dsc": "300g",
            "price": 15.00,
            "no_ingredients": true
        },
        {
            "id": "acai-500g",
            "img": "img/acai-tigela.png",
            "name": "Açaí no Pote 500g",
            "dsc": "500g",
            "price": 18.00,
            "no_ingredients": true
        },
        {
            "id": "acai-zero-250ml",
            "img": "img/Pote%20a%C3%A7a%C3%AD%20no%20grau%20-%20zero%20250ml.png",
            "name": "Açaí no Grau Zero 250ml",
            "dsc": "250ml",
            "price": 16.00,
            "no_ingredients": true
        },
        {
            "id": "acai-leitinho-250ml",
            "img": "img/Pote%20creme%20de%20Leitinho%20250ml.png",
            "name": "Pote Creme de Leitinho 250ml",
            "dsc": "250ml",
            "price": 17.00,
            "no_ingredients": true
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
