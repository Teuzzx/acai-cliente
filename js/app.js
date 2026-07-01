$(document).ready(function () {
    cardapio.eventos.init()
})

var cardapio = {}

var MEU_CARRINHO = []

var MEU_ENDERECO = null

var VALOR_CARRINHO = 0

// IMPORTANTE: Valor fixo de entrega para delivery = R$ 5,00
var VALOR_ENTREGA = 5

// Número do estabelecimento (usar formato internacional sem +). Atualizado conforme solicitado.
var CELULAR_ESTABELECIMENTO = "55" + "89994472860" // equivalente a 5589994472860
const BACKEND_URL = ''  // Usando wrapper Supabase direto – não precisa de backend

var MEU_CLIENTE = null
var MEU_TELEFONE = null
var CURRENT_CUPOM = null

function isRetiradaType(value) {
    const normalized = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalized.includes('retirada') || normalized.includes('retirar')
}

cardapio.eventos = {
    init: () => {
        // Renderiza o cardápio completo (tigelas + potes) sem abas
        cardapio.metodos.obterCardapioCompleto()
        cardapio.metodos.carregarBotaoReserva()
        cardapio.metodos.carregarBotaoLigar()
        cardapio.metodos.carregarBotaoWhatsapp()
        // Fallback: garante que o botão Enviar Pedido chame o envio mesmo se outro binding falhar
        $('#btnEtapaEnviarResumo').off('click').on('click', (e) => {
            e.preventDefault()
            cardapio.metodos.enviarPedidoAoBackend()
        })

        
    }
}

cardapio.metodos = {
    // Obtem a lista de itens do cardapio
    obterItensCardapio: (categoria = 'acai', vermais = false) => {
        var filtro = MENU[categoria]

        // segurança: se categoria inválida, mostra aviso e evita erro no foreach
        if (!filtro || !Array.isArray(filtro)) {
            console.warn('Categoria de cardápio não encontrada:', categoria)
            $("#itensCardapio").html('<div class="col-12"><p class="carrinho-vazio">Nenhum item disponível nesta categoria.</p></div>')
            $("#btnVerMais").addClass('hidden')
            // limpar active
            $(".container-menu a").removeClass('active')
            if ($('#menu-' + categoria).length) $('#menu-' + categoria).addClass('active')
            return
        }

        if (!cardapio.templates || !cardapio.templates.item) {
            console.error('Template de item do cardápio não definido')
            $("#itensCardapio").html('<div class="col-12"><p class="carrinho-vazio">Erro interno ao carregar o cardápio.</p></div>')
            $("#btnVerMais").addClass('hidden')
            return
        }

        if (!vermais) {
            $("#itensCardapio").html('')
            $("#btnVerMais").removeClass('hidden')
        }



        $.each(filtro, (i, e) => {

            let temp = cardapio.templates.item.replace(/\${img}/g, e.img)
                .replace(/\${nome}/g, e.name)
                .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                .replace(/\${id}/g, e.id)

            // botão "Ver mais" foi clicado (12 itens)
            if (vermais && i >= 8 && i < 12) {
                $("#itensCardapio").append(temp)
            }

            // paginação inicial (8 itens)
            if (!vermais && i < 8) {
                $("#itensCardapio").append(temp)
            }

        })

        // Garantir visibilidade dos cards e da seção caso as animações de scroll não tenham sido aplicadas ainda
        $("#itensCardapio .scroll-animate").each(function () {
            if (window.scrollAnimations && typeof window.scrollAnimations.animateElement === 'function') {
                window.scrollAnimations.animateElement(this)
            } else {
                $(this).addClass('in-view')
            }
        })

        const cardapioSection = document.getElementById('cardapio')
        if (cardapioSection) {
            if (window.scrollAnimations && typeof window.scrollAnimations.animateElement === 'function') {
                window.scrollAnimations.animateElement(cardapioSection)
            } else {
                cardapioSection.classList.add('in-view')
            }
        }

        //remove o active
        $(".container-menu a").removeClass('active')

        // seta o menu para ativo
        $('#menu-' + categoria).addClass('active')
    },

    // Clique no botão de "Ver mais"
    verMais: () => {

        var ativo = $(".container-menu a.active").attr('id').split('menu-')[1]
        cardapio.metodos.obterItensCardapio(ativo, true)

        $("#btnVerMais").addClass('hidden')

    },

    // Renderiza o cardápio completo em sequência: Açaí Tigela (montável) e Potes
    obterCardapioCompleto: () => {
        $("#itensCardapio").html('')
        $("#btnVerMais").addClass('hidden')

        const sections = [
            { key: 'acai', title: 'AÇAÍ TIGELA (MONTÁVEL)' },
            { key: 'potes', title: 'POTES' }
        ]

        sections.forEach(sec => {
            // seção título
            $("#itensCardapio").append(`<div class="col-12"><div class="section-header"><h3>${sec.title}</h3></div></div>`)

            const filtro = MENU[sec.key] || []
            $.each(filtro, (i, e) => {
                let temp = cardapio.templates.item.replace(/\${img}/g, e.img)
                    .replace(/\${nome}/g, e.name)
                    .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                    .replace(/\${id}/g, e.id)

                $("#itensCardapio").append(temp)
            })
        })

        // garantir animações
        $("#itensCardapio .scroll-animate").each(function () {
            if (window.scrollAnimations && typeof window.scrollAnimations.animateElement === 'function') {
                // tentar usar o gerenciador de animações (IntersectionObserver)
                try {
                    window.scrollAnimations.animateElement(this)
                } catch (err) {
                    $(this).addClass('in-view')
                }
            } else {
                $(this).addClass('in-view')
            }
        })

        // Compat fallback: alguns navegadores móveis podem não ativar o observer imediatamente.
        // Garantir visibilidade após pequeno atraso.
        setTimeout(() => {
            $("#itensCardapio .scroll-animate").each(function () {
                if (!$(this).hasClass('in-view')) $(this).addClass('in-view')
            })
        }, 300)

        // remove active (não há abas)
        $(".container-menu a").removeClass('active')
    },

    // Diminuir a quantidade do item no cardapio
    diminuirQuantidade: (id) => {
        let qntdAtual = parseInt($("#qntd-" + id).text())

        if (qntdAtual > 0) {
            $('#qntd-' + id).text(qntdAtual - 1)
        }
    },

    // Aumentar a quantidade do item no cardapio
    aumentarQuantidade: (id) => {

        let qntdAtual = parseInt($('#qntd-' + id).text())

        $('#qntd-' + id).text(qntdAtual + 1)
    },

    // Adicionar ao carrinho o item do cardapio
    adicionarAoCarrinho: (id) => {
        let qntdAtual = parseInt($('#qntd-' + id).text())

        if (qntdAtual > 0) {
            // Como não usamos mais abas, localizar o produto por id em todas as categorias
            let item = []
            for (const cat in MENU) {
                const found = $.grep(MENU[cat], (e) => { return e.id == id })
                if (found && found.length > 0) {
                    item = found
                    break
                }
            }

            if (item.length > 0) {
                // Como agora cada item pode ter ingredientes diferentes, vamos adicionar como um novo item se for aa
                // Ou se quiser manter a lgica de agrupar, precisaria comparar os ingredientes.
                // O prompt diz: "Adicionar apenas: Aa - Tamanho G. Ainda sem ingredientes selecionados."
                
                for (let i = 0; i < qntdAtual; i++) {
                    let novoItem = $.extend(true, {}, item[0]);
                    novoItem.qntd = 1;
                    novoItem.idCarrinho = Math.floor(Date.now() * Math.random().toString());
                    novoItem.coberturas = [];
                    novoItem.complementos = [];
                    novoItem.bases = [];
                    novoItem.frutas = [];

                    // Se o produto for um "preset" (ex: picolés, potes prontos),
                    // marca como não customizável e já fornece uma base para
                    // que o fluxo de checkout não exija seleção de ingredientes.
                    if (item[0].no_ingredients) {
                        novoItem.no_ingredients = true;
                        // preenche uma base fictícia para passar na verificação
                        novoItem.bases = ['preset'];
                    } else {
                        novoItem.no_ingredients = false;
                    }

                    MEU_CARRINHO.push(novoItem);
                }

                cardapio.metodos.mensagem('Item adicionado ao carrinho', "green")
                $('#qntd-' + id).text(0)
                cardapio.metodos.atualizarBadgeTotal()
            }
        }
    },

    //Atualiza o badge de totais dos botes
    atualizarBadgeTotal: () => {

        var total = 0

        $.each(MEU_CARRINHO, (i, e) => {
            total += e.qntd
        })

        if (total > 0) {
            $(".botao-carrinho").removeClass('hidden')
            $(".container-total-carrinho").removeClass('hidden')

        } else {
            $(".botao-carrinho").addClass('hidden')
            $(".container-total-carrinho").addClass('hidden')
        }

        $('.badge-total-carrinho').html(total)
    },

    // Abrir modal de carrinho
    abrirCarrinho: (abrir) => {
        if (abrir) {
            $("#modalCarrinho").removeClass('hidden')
            $('#btnAbrirCarrinho').addClass('hidden')
            cardapio.metodos.carregarCarrinho()
        } else {
            $("#modalCarrinho").addClass('hidden')
            $('#btnAbrirCarrinho').removeClass('hidden')
        }
    },

    //Altera os textos e exibe os botões das etapas
    carregarEtapa: (etapa) => {
        if (etapa == 1) {
            $("#lblTituloEtapa").text('Seu carrinho:')
            $("#observacoesPreview").text('')
            $("#itensCarrinho").removeClass('hidden')
            $("#localEntrega").addClass('hidden')
            $("#resumoCarrinho").addClass('hidden')

            $(".etapa").removeClass('active')
            $(".etapa1").addClass('active')

            $("#btnEtapaPedido").removeClass('hidden')
            $("#btnEtapaEndereco").addClass('hidden')
            $("#btnEtapaEnviarResumo").addClass('hidden')
            $("#btnVoltar").addClass('hidden')
        }

        if (etapa == 2) {
            $("#lblTituloEtapa").text('Endereço de entrega:')
            $("#itensCarrinho").addClass('hidden')
            $("#localEntrega").removeClass('hidden')
            $("#resumoCarrinho").addClass('hidden')

            $(".etapa").removeClass('active')
            $(".etapa1").addClass('active')
            $(".etapa2").addClass('active')

            $("#btnEtapaPedido").addClass('hidden')
            $("#btnEtapaEndereco").removeClass('hidden')
            $("#btnEtapaEnviarResumo").addClass('hidden')
            $("#btnVoltar").removeClass('hidden')
        }

        if (etapa == 3) {
            $("#lblTituloEtapa").text('Resumo do pedido:')
            $("#itensCarrinho").addClass('hidden')
            $("#localEntrega").addClass('hidden')
            $("#resumoCarrinho").removeClass('hidden')

            $(".etapa").removeClass('active')
            $(".etapa1").addClass('active')
            $(".etapa2").addClass('active')
            $(".etapa3").addClass('active')

            $("#btnEtapaPedido").addClass('hidden')
            $("#btnEtapaEndereco").addClass('hidden')
            $("#btnEtapaEnviarResumo").removeClass('hidden')
            $("#btnVoltar").removeClass('hidden')
        }

    },

    // botão de voltar etapa
    voltarEtapa: () => {
        let etapa = $(".etapa.active").length
        cardapio.metodos.carregarEtapa(etapa - 1)
    },

    // Carrega a lista de itens do carrinho e a etapa
    carregarCarrinho: () => {
        cardapio.metodos.carregarEtapa(1)

        if (MEU_CARRINHO.length > 0) {
            $("#itensCarrinho").html('')

            $.each(MEU_CARRINHO, (i, e) => {
                let temp = cardapio.templates.itemCarrinho.replace(/\${img}/g, e.img)
                    .replace(/\${nome}/g, e.name)
                    .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                    .replace(/\${id}/g, e.idCarrinho)
                    .replace(/\${qntd}/g, e.qntd)

                let html = $(temp);

                // Se o item for preset (sem ingredientes), remove o botão de "Escolher ingredientes"
                if (e.no_ingredients) {
                    html.find('.btn-escolher-ingredientes').remove();
                }

                // Adiciona ingredientes se houver (para itens customizáveis)
                let desc = "";
                if (e.coberturas && e.coberturas.length > 0) desc += "Coberturas: " + e.coberturas.join(', ') + "<br>";
                if (e.complementos && e.complementos.length > 0) desc += "Ingredientes: " + e.complementos.join(', ');

                if (desc != "") {
                    html.find('.dados-produto').append(`<p class="desc-produto">${desc}</p>`);
                }

                $("#itensCarrinho").append(html)
            })

            cardapio.metodos.carregarValores()
            cardapio.metodos.verificarCarrinhoCompleto()

        } else {
            $("#itensCarrinho").html('<p class="carrinho-vazio"> <i class="fa fa-shopping-bag"></i> Seu carrinho est vazio.</p>')
            cardapio.metodos.carregarValores()
        }
    },

    // Verifica se todos os itens têm ingredientes customizados
    verificarCarrinhoCompleto: () => {
        const todosProntos = MEU_CARRINHO.every(item => {
            // Cada item PRECISA ter pelo menos 1 base (obrigatrio)
            return item.bases && item.bases.length >= 1;
        });

        const btnContinuar = $('#btnEtapaPedido');
        if (todosProntos && MEU_CARRINHO.length > 0) {
            btnContinuar.prop('disabled', false).removeClass('disabled');
        } else {
            btnContinuar.prop('disabled', true).addClass('disabled');
        }
    },


    // Diminuir quantidade do item no carrinho
    diminuirQuantidadeCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text())

        if (qntdAtual > 1) {
            $('#qntd-carrinho-' + id).text(qntdAtual - 1)
            cardapio.metodos.atualizarCarrinho(id, qntdAtual - 1)
        } else {
            cardapio.metodos.removerItemCarrinho(id)
        }
    },

    // Aumentar quantidade do item no carrinho
    aumentarQuantidadeCarrinho: (id) => {
        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text())
        $('#qntd-carrinho-' + id).text(qntdAtual + 1)
        cardapio.metodos.atualizarCarrinho(id, qntdAtual + 1)
    },

    // botão remover item do carrinho
    removerItemCarrinho: (id) => {
        MEU_CARRINHO = $.grep(MEU_CARRINHO, (e, i) => { return e.idCarrinho != id })
        cardapio.metodos.carregarCarrinho()
        cardapio.metodos.atualizarBadgeTotal()
    },

    // Atualiza o carrinho com a quantidade atual
    atualizarCarrinho: (id, qntd) => {
        let objIndex = MEU_CARRINHO.findIndex((obj => obj.idCarrinho == id))
        MEU_CARRINHO[objIndex].qntd = qntd
        cardapio.metodos.atualizarBadgeTotal()
        cardapio.metodos.carregarValores()
    },

    atualizarOpcaoEntrega: () => {
        let opcao = $('input[name="opcaoEntrega"]:checked').val();
        if (opcao == 'retirada') {
            VALOR_ENTREGA = 0;
            $('.container-endereco').addClass('hidden');
        } else {
            VALOR_ENTREGA = 5;
            $('.container-endereco').removeClass('hidden');
        }
        cardapio.metodos.carregarValores();
    },

    abrirModalIngredientes: (idCarrinho) => {
        const item = MEU_CARRINHO.find(e => e.idCarrinho == idCarrinho);
        if (!item) return;

        const LIMITS = { bases: {min:1, max:2}, frutas: {min:0, max:2}, coberturas: {min:0, max:2}, complementos: {min:0, max:4} };

        $("#modalIngredientes").removeClass('hidden');
        $("#listaBases").html('');
        $("#listaFrutas").html('');
        $("#listaCoberturas").html('');
        $("#listaComplementos").html('');

        function renderList(list, containerId, groupName, checkedValues) {
            list.forEach(i => {
                const isChecked = checkedValues && checkedValues.includes(i.name);
                const escaped = i.name.replace(/"/g, '&quot;');
                const el = `
                    <div class="ingrediente-card" data-group="${groupName}">
                        <input type="checkbox" class="chk-ingred" data-group="${groupName}" id="${groupName}-${i.id}" value="${escaped}" ${isChecked? 'checked' : ''}>
                        <label class="ingrediente-label" for="${groupName}-${i.id}">${i.name}</label>
                    </div>
                `;
                $(containerId).append(el);
            });
        }

        renderList(INGREDIENTES.bases, '#listaBases', 'bases', item.bases || []);
        renderList(INGREDIENTES.frutas, '#listaFrutas', 'frutas', item.frutas || []);
        renderList(INGREDIENTES.coberturas, '#listaCoberturas', 'coberturas', item.coberturas || []);
        renderList(INGREDIENTES.complementos, '#listaComplementos', 'complementos', item.complementos || []);

        function atualizarContadoresEEstados() {
            const counts = { bases:0, frutas:0, coberturas:0, complementos:0 };
            $('.chk-ingred:checked').each(function(){ counts[$(this).data('group')]++ });

            $('#contadorBases').text(`${counts.bases} selecionadas (12)`);
            $('#contadorFrutas').text(`${counts.frutas} selecionadas (02)`);
            $('#contadorCoberturas').text(`${counts.coberturas} selecionadas (02)`);
            $('#contadorComplementos').text(`${counts.complementos} selecionadas (04)`);
            $('#totalSelecionados').text(`${counts.bases + counts.frutas + counts.coberturas + counts.complementos} selecionados`);

            // Habilita/desabilita checkboxes por limite
            ['bases','frutas','coberturas','complementos'].forEach(group => {
                const max = LIMITS[group].max;
                if (counts[group] >= max) {
                    $(`.chk-ingred[data-group='${group}']`).not(':checked').each(function(){
                        $(this).prop('disabled', true).closest('.ingrediente-card').addClass('disabled');
                    });
                } else {
                    $(`.chk-ingred[data-group='${group}']`).each(function(){
                        $(this).prop('disabled', false).closest('.ingrediente-card').removeClass('disabled');
                    });
                }
            });

            const basesOk = counts.bases >= LIMITS.bases.min && counts.bases <= LIMITS.bases.max;
            const othersOk = counts.frutas <= LIMITS.frutas.max && counts.coberturas <= LIMITS.coberturas.max && counts.complementos <= LIMITS.complementos.max;
            const confirmBtn = $('#btnConfirmarIngredientes');
            if (basesOk && othersOk) {
                confirmBtn.prop('disabled', false).removeClass('disabled');
            } else {
                confirmBtn.prop('disabled', true).addClass('disabled');
            }
        }

        $(document).off('change.modalIngredientes', '.chk-ingred');
        $(document).on('change.modalIngredientes', '.chk-ingred', function(){ atualizarContadoresEEstados(); });

        atualizarContadoresEEstados();

        $('#btnConfirmarIngredientes').off('click.modalIngredientes').on('click.modalIngredientes', () => {
            const selecionados = { bases:[], frutas:[], coberturas:[], complementos:[] };
            $('.chk-ingred:checked').each(function(){
                const group = $(this).data('group');
                selecionados[group].push($(this).val());
            });

            if (selecionados.bases.length < LIMITS.bases.min) { cardapio.metodos.mensagem('Escolha ao menos 1 base'); return; }
            if (selecionados.bases.length > LIMITS.bases.max) { cardapio.metodos.mensagem('Máximo de 2 bases'); return; }
            if (selecionados.frutas.length > LIMITS.frutas.max) { cardapio.metodos.mensagem('Máximo de 2 frutas'); return; }
            if (selecionados.coberturas.length > LIMITS.coberturas.max) { cardapio.metodos.mensagem('Máximo de 2 coberturas'); return; }
            if (selecionados.complementos.length > LIMITS.complementos.max) { cardapio.metodos.mensagem('Máximo de 4 complementos'); return; }

            item.bases = selecionados.bases;
            item.frutas = selecionados.frutas;
            item.coberturas = selecionados.coberturas;
            item.complementos = selecionados.complementos;

            cardapio.metodos.fecharModalIngredientes();
            cardapio.metodos.carregarCarrinho();
        });
    },

    fecharModalIngredientes: () => {
        $("#modalIngredientes").addClass('hidden');
    },

    // Carrega os valores de sub-total, entrega e total
    carregarValores: () => {

        VALOR_CARRINHO = 0

        $("#lblSubTotal").text('R$ 0,00')
        $("#lblValorEntrega").text('+ R$ 0,00')
        $("#lblValorTotal").text('R$ 0,00')

        $.each(MEU_CARRINHO, (i, e) => {
            VALOR_CARRINHO += parseFloat(e.price * e.qntd)
        })

        const subtotal = VALOR_CARRINHO;
        let desconto = 0;

        if (CURRENT_CUPOM && CURRENT_CUPOM.active) {
            if (CURRENT_CUPOM.type === 'percent') {
                desconto = (CURRENT_CUPOM.value / 100) * subtotal;
            } else if (CURRENT_CUPOM.type === 'fixed') {
                desconto = CURRENT_CUPOM.value;
            }
            if (desconto > subtotal) desconto = subtotal;

            $('#lblCupomAplicado').remove();
            $('.container-total').append(`<div id="lblCupomAplicado" style="font-size:14px; color:green;">Cupom aplicado: ${CURRENT_CUPOM.code} — desconto de R$ ${desconto.toFixed(2).replace('.', ',')}</div>`);
        } else {
            $('#lblCupomAplicado').remove();
        }

        let total = subtotal - desconto + VALOR_ENTREGA;
        if (total < 0) total = 0;

        $("#lblSubTotal").text(`R$ ${subtotal.toFixed(2).replace('.', ',')}`)
        $("#lblValorEntrega").text(`+ R$ ${VALOR_ENTREGA.toFixed(2).replace('.', ',')}`)
        $("#lblValorTotal").text(`R$ ${total.toFixed(2).replace('.', ',')}`)
    },

    aplicarCupom: async () => {
        const code = $('#txtCupom').val().trim()
        if (!code) { cardapio.metodos.mensagem('Informe o código do cupom'); return }

        try {
            // Usar cuponsService que busca direto no Supabase (tabela correta: cupons, campo: codigo)
            if (window.cuponsService && typeof window.cuponsService.validar === 'function') {
                const cupom = await window.cuponsService.validar(code)
                if (!cupom) {
                    cardapio.metodos.mensagem('Cupom inválido ou expirado')
                    return
                }
                // Mapear para formato interno
                CURRENT_CUPOM = {
                    code: cupom.codigo,
                    type: cupom.tipo_desconto === 'percentual' ? 'percent' : 'fixed',
                    value: Number(cupom.desconto),
                    active: true,
                    _raw: cupom
                }
                cardapio.metodos.mensagem('Cupom aplicado!', 'green')
                $('#btnRemoverCupom').removeClass('hidden')
                cardapio.metodos.carregarValores()
                return
            }

            cardapio.metodos.mensagem('Serviço de cupons não disponível')
        } catch (err) {
            console.error(err)
            cardapio.metodos.mensagem('Erro ao validar cupom')
        }
    },

    removerCupom: () => {
        CURRENT_CUPOM = null
        $('#txtCupom').val('')
        $('#btnRemoverCupom').addClass('hidden')
        cardapio.metodos.mensagem('Cupom removido')
        cardapio.metodos.carregarValores()
    },

    // Carregar a etapa de Endereço
    carregarEndereco: () => {

        if (MEU_CARRINHO.length <= 0) {
            cardapio.metodos.mensagem('Seu carrinho está vazio.')
            return
        }

        cardapio.metodos.carregarEtapa(2)
    },

    //API ViaCEP
    buscarCEP: () => {

        // cria a variavel com o valor do CEP
        var cep = $('#txtCEP').val().trim().replace(/\D/g, '')

        //verifica se o cep possui valor informado
        if(cep != '') {
            
            //Expresso Regular para validar o CEP
            var validaCep = /^[0-9]{8}$/ 
            
            if(validaCep.test(cep)) {

                $.getJSON('https://viacep.com.br/ws/' + cep +"/json/?callback=?", function (dados) {

                    if(!("erro" in dados)) {

                        //Atualizar os campos com os valores retornados
                        $('#txtEndereco').val(dados.logradouro)
                        $('#txtBairro').val(dados.bairro)
                        $('#txtCidade').val(dados.localidade)
                        $('#ddlUF').val(dados.uf)
                        $('#txtNumero').focus()

                    } else {
                        cardapio.metodos.mensagem('CEP não encontrado, preencha as informações manualmente')
                        $('#txtEndereco').focus()
                    }

                })

            } else {
                cardapio.metodos.mensagem('Formato do CEP inválido')
                $('#txtCEP').focus()
            }

        } else {
            cardapio.metodos.mensagem('Informe o CEP, por favor.')
            $('#txtCEP').focus()
        }


    },

    validarCidadeDelivery: (cidade, uf) => {
        if (!cidade || !uf) return false
        const normalize = (value) => value.toString()
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[ -]/g, (char) => char) // preserve ASCII
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z0-9]/g, '')
        return normalize(cidade) === 'PARNAIBA' && normalize(uf) === 'PI'
    },

    // Validação antes de prosseguir para a etapa 3
    resumoPedido: () => {
        let opcao = $('input[name="opcaoEntrega"]:checked').val();

        if (opcao == 'delivery') {
            let cep = $('#txtCEP').val().trim()
            let endereco = $('#txtEndereco').val().trim()
            let bairro = $('#txtBairro').val().trim()
            let cidade = $('#txtCidade').val().trim()
            let uf = $('#ddlUF').val().trim()
            let numero = $('#txtNumero').val().trim()
            let complemento = $('#txtComplemento').val().trim()

            if(cidade.length <= 0) {
                cidade = 'Parnaíba'
            }
            if(uf.length <= 0 || uf === '-1') {
                uf = 'PI'
            }

            if(cep.length <= 0) {
                cardapio.metodos.mensagem('Informe o CEP, por favor.')
                $('#txtCEP').focus()
                return
            }
            if(endereco.length <= 0) {
                cardapio.metodos.mensagem('Informe o Endereço, por favor.')
                $('#txtEndereco').focus()
                return
            }
            if(bairro.length <= 0) {
                cardapio.metodos.mensagem('Informe o Bairro, por favor.')
                $('#txtBairro').focus()
                return
            }
            if(cidade.length <= 0) {
                cardapio.metodos.mensagem('Informe a Cidade, por favor.')
                $('#txtCidade').focus()
                return
            }
            if(uf == "-1") {
                cardapio.metodos.mensagem('Informe a UF, por favor.')
                $('#ddlUF').focus()
                return
            }
            if(!cardapio.metodos.validarCidadeDelivery(cidade, uf)) {
                cardapio.metodos.mensagem('Este site de pedidos funciona somente na franquia de Parnaíba. Delivery só para clientes em Parnaíba - PI.')
                $('#txtCidade').focus()
                return
            }
            if(numero.length <= 0) {
                cardapio.metodos.mensagem('Informe o Número, por favor.')
                $('#txtNumero').focus()
                return
            }

            // validar nome e telefone
            let nome = $('#txtNome').val().trim()
            let telefone = $('#txtTelefone').val().trim()

            if (nome.length <= 0) {
                cardapio.metodos.mensagem('Informe o nome, por favor.')
                $('#txtNome').focus()
                return
            }
            if (telefone.length <= 0) {
                cardapio.metodos.mensagem('Informe o telefone, por favor.')
                $('#txtTelefone').focus()
                return
            }

            MEU_CLIENTE = nome
            MEU_TELEFONE = telefone

            MEU_ENDERECO = {
                cep: cep,
                endereco: endereco,
                bairro: bairro,
                cidade: cidade,
                uf: uf,
                numero: numero,
                complemento: complemento,
                forma: 'Entrega (Delivery)'
            }
        } else {
            MEU_ENDERECO = {
                forma: 'Retirar na loja (Grátis)'
            }
        }

        // Para retirada também pedimos nome e telefone
        if (!MEU_CLIENTE) {
            let nome = $('#txtNome').val().trim()
            let telefone = $('#txtTelefone').val().trim()
            if (nome.length <= 0) {
                cardapio.metodos.mensagem('Informe o nome, por favor.')
                $('#txtNome').focus()
                return
            }
            if (telefone.length <= 0) {
                cardapio.metodos.mensagem('Informe o telefone, por favor.')
                $('#txtTelefone').focus()
                return
            }
            MEU_CLIENTE = nome
            MEU_TELEFONE = telefone
        }

        cardapio.metodos.carregarEtapa(3)
        cardapio.metodos.carregarResumo()
    },

    // Carrega a etapa Resumo do Pedido
    carregarResumo: () => {
        $('#listaItensResumo').html('')

        $.each(MEU_CARRINHO, (i,e) => {
            let temp = cardapio.templates.itemResumo.replace(/\${img}/g, e.img)
                    .replace(/\${nome}/g, e.name)
                    .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                    .replace(/\${qntd}/g, e.qntd)

            let html = $(temp);
            let desc = "";
            if (e.bases && e.bases.length) desc += "Base: " + e.bases.join(', ') + "<br>";
            if (e.frutas && e.frutas.length) desc += "Frutas: " + e.frutas.join(', ') + "<br>";
            if (e.coberturas.length > 0) desc += "Coberturas: " + e.coberturas.join(', ') + "<br>";
            if (e.complementos.length > 0) desc += "Complementos: " + e.complementos.join(', ');
            if (desc != "") {
                html.find('.dados-produto').append(`<p class="desc-produto">${desc}</p>`);
            }
            $("#listaItensResumo").append(html)
        })

        if (MEU_ENDERECO.forma == 'Entrega (Delivery)') {
            $("#resumoEndereco").html(`${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`)
            $("#cidadeEndereco").html(`${MEU_ENDERECO.cidade} - ${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`)
        } else {
            $("#resumoEndereco").html('Retirada na loja')
            $("#cidadeEndereco").html('Retirada no estabelecimento - buscar no ponto de venda')
        }
        if (CURRENT_CUPOM && CURRENT_CUPOM.active) {
            // Calcular o desconto aplicado apenas ao produto (sem incluir frete)
            let descontoResumo = 0;
            if (CURRENT_CUPOM.type === 'percent') {
                descontoResumo = (CURRENT_CUPOM.value / 100) * VALOR_CARRINHO;
            } else if (CURRENT_CUPOM.type === 'fixed') {
                descontoResumo = CURRENT_CUPOM.value;
            }
            if (descontoResumo > VALOR_CARRINHO) descontoResumo = VALOR_CARRINHO;
            
            if (!$('#resumoCupom').length) {
                $('#resumoCarrinho .container-total').append(`<div id="resumoCupom" style="color:green; margin-top:10px; padding-top:10px; border-top:1px solid #eee;"><strong style="font-size:12px;">✓ Cupom: ${CURRENT_CUPOM.code}</strong><br><small style="color:#666; font-size:11px;">Desconto aplicado apenas no produto:<br>R$ ${descontoResumo.toFixed(2).replace('.', ',')} de desconto</small><br><small style="color:#666; font-size:11px;">Frete: R$ ${VALOR_ENTREGA.toFixed(2).replace('.', ',')} (valor fixo)</small></div>`)
            } else {
                $('#resumoCupom').html(`<strong style="font-size:12px;">✓ Cupom: ${CURRENT_CUPOM.code}</strong><br><small style="color:#666; font-size:11px;">Desconto aplicado apenas no produto:<br>R$ ${descontoResumo.toFixed(2).replace('.', ',')} de desconto</small><br><small style="color:#666; font-size:11px;">Frete: R$ ${VALOR_ENTREGA.toFixed(2).replace('.', ',')} (valor fixo)</small>`)
            }
        } else {
            $('#resumoCupom').remove()
        }
 
        cardapio.metodos.finalizarPedido();
    },

    // Envia o pedido para o backend e, ao finalizar, abre o WhatsApp
    enviarPedidoAoBackend: async () => {
        if (MEU_CARRINHO.length <= 0 || MEU_ENDERECO == null) {
            cardapio.metodos.mensagem('Carrinho vazio ou endereço inválido')
            return
        }

        // feedback UI
        const $btn = $('#btnEtapaEnviarResumo')
        const oldText = $btn.text()
        $btn.prop('disabled', true).addClass('disabled').text('Enviando...')

        const produtosPayload = MEU_CARRINHO.map(p => ({
            idCarrinho: p.idCarrinho,
            id: p.id,
            name: p.name,
            price: p.price,
            qntd: p.qntd,
            dsc: p.dsc || null,
            tamanho: p.dsc || p.size || p.tamanho || null,
            bases: p.bases || [],
            frutas: p.frutas || [],
            coberturas: p.coberturas || [],
            complementos: p.complementos || []
        }))

        const totalValue = parseFloat((VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2))

        const enderecoStr = (MEU_ENDERECO && MEU_ENDERECO.forma == 'Entrega (Delivery)')
            ? `${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro} - ${MEU_ENDERECO.cidade}/${MEU_ENDERECO.uf}`
            : null

        const payload = {
            cliente: MEU_CLIENTE || 'Cliente',
            telefone: MEU_TELEFONE || '',
            produtos: produtosPayload,
            total: totalValue,
            cupom: CURRENT_CUPOM ? (CURRENT_CUPOM.code || null) : null,
            endereco: enderecoStr,
            tipo_entrega: isRetiradaType(MEU_ENDERECO && MEU_ENDERECO.forma) ? 'retirada' : 'delivery',
            observacao: $('#txtObservacao').val() || null,
            status: 'novo'
        }

        // calcula total ajustado considerando cupom (será enviado no payload)
        let adjustedTotal = totalValue;
        let desconto = 0;
        let precoOriginal = 0;
        
        if (CURRENT_CUPOM && CURRENT_CUPOM.active) {
            // IMPORTANTE: Desconto aplicado APENAS ao valor do produto (VALOR_CARRINHO), NÃO inclui frete
            if (CURRENT_CUPOM.type === 'percent') desconto = (CURRENT_CUPOM.value/100) * VALOR_CARRINHO;
            else if (CURRENT_CUPOM.type === 'fixed') desconto = CURRENT_CUPOM.value;
            if (desconto > VALOR_CARRINHO) desconto = VALOR_CARRINHO;
            
            // Preço original = VALOR_CARRINHO (produtos sem desconto)
            precoOriginal = VALOR_CARRINHO;
            // Total final = (VALOR_CARRINHO - desconto) + VALOR_ENTREGA
            adjustedTotal = (VALOR_CARRINHO - desconto) + VALOR_ENTREGA;
        } else {
            precoOriginal = VALOR_CARRINHO;
        }
        
        if (adjustedTotal < 0) adjustedTotal = 0;
        payload.total = parseFloat(adjustedTotal.toFixed(2));
        payload.valor_desconto = parseFloat(desconto.toFixed(2));
        payload.valor_produto_original = parseFloat(precoOriginal.toFixed(2));
        payload.valor_frete = parseFloat(VALOR_ENTREGA.toFixed(2));

        // Validações cliente/telefone/produtos antes de enviar (evita 400 simples)
        if (!payload.cliente || String(payload.cliente).trim().length === 0) {
            cardapio.metodos.mensagem('Informe o nome do cliente antes de enviar')
            $btn.prop('disabled', false).removeClass('disabled').text(oldText)
            return
        }
        if (!payload.telefone || String(payload.telefone).trim().length === 0) {
            cardapio.metodos.mensagem('Informe o telefone antes de enviar')
            $btn.prop('disabled', false).removeClass('disabled').text(oldText)
            return
        }
        if (MEU_ENDERECO && MEU_ENDERECO.forma === 'Entrega (Delivery)' && !cardapio.metodos.validarCidadeDelivery(MEU_ENDERECO.cidade, MEU_ENDERECO.uf)) {
            cardapio.metodos.mensagem('Este site de pedidos funciona somente na franquia de Parnaíba. Delivery só para clientes em Parnaíba - PI.')
            $btn.prop('disabled', false).removeClass('disabled').text(oldText)
            return
        }
        if (!Array.isArray(payload.produtos) || payload.produtos.length === 0) {
            cardapio.metodos.mensagem('Carrinho vazio  adicione um item antes de enviar')
            $btn.prop('disabled', false).removeClass('disabled').text(oldText)
            return
        }

        try {
            // Preferir envio via BACKEND_URL (backend local/prod) quando configurado;
            // caso BACKEND_URL não esteja definido, usar o wrapper Supabase direto no cliente.
            // Sempre preferir siteOrders direto (sem depender de backend local)
            const dbClient = window.supabaseClient;
            const useOrderHelper = dbClient && window.siteOrders && typeof window.siteOrders.submitOrder === 'function';
            if (useOrderHelper) {
                // Usar integração centralizada (site_orders.js) para criar pedido + pedido_itens
                // Prepara customer e cart no formato esperado por siteOrders.submitOrder
                const customerObj = { name: payload.cliente || null, phone: payload.telefone || null };
                const cartForOrder = MEU_CARRINHO.map(p => ({
                    product_id: null, // IDs locais (açaí-g etc) não são UUIDs válidos do banco
                    sku: p.id || null, // salva o id local como sku para rastreio
                    name: p.name || p.produto_nome || 'Produto',
                    qty: Number(p.qntd || p.quantity || 1),
                    unit_price_cents: Number(p.unit_price_cents ?? Math.round((p.price || 0) * 100)),
                    options: {
                        tamanho: p.dsc || p.size || p.tamanho || null,
                        tamanho_label: p.dsc || p.size || p.tamanho || null,
                        bases: p.bases || [],
                        frutas: p.frutas || [],
                        coberturas: p.coberturas || [],
                        complementos: p.complementos || []
                    }
                }));

                // Chama a função reutilizável que já insere em `pedidos` e `pedido_itens`
                // IMPORTANTE: Desconto é calculado APENAS sobre VALOR_CARRINHO, não inclui frete
                let descontoAplicado = CURRENT_CUPOM && CURRENT_CUPOM.active ? (
                    CURRENT_CUPOM.type === 'percent'
                        ? (CURRENT_CUPOM.value / 100) * VALOR_CARRINHO
                        : CURRENT_CUPOM.value
                ) : 0;
                if (descontoAplicado > VALOR_CARRINHO) descontoAplicado = VALOR_CARRINHO;

                // Preparar deliveryInfo com valor_entrega incluído
                const deliveryInfoComFrete = MEU_ENDERECO ? { ...MEU_ENDERECO, valor_entrega: VALOR_ENTREGA } : { valor_entrega: VALOR_ENTREGA };

                await window.siteOrders.submitOrder({
                    customer: customerObj,
                    cart: cartForOrder,
                    deliveryInfo: deliveryInfoComFrete,
                    tipo_entrega: isRetiradaType(MEU_ENDERECO && MEU_ENDERECO.forma) ? 'retirada' : 'delivery',
                    cupom_codigo: CURRENT_CUPOM ? (CURRENT_CUPOM.code || CURRENT_CUPOM.codigo || null) : null,
                    valor_desconto: parseFloat(descontoAplicado.toFixed(2))
                });

                cardapio.metodos.mensagem('Pedido enviado com sucesso!', 'green')
                cardapio.metodos._abrirWhatsAppResumo(payload)
                MEU_CARRINHO = []
                cardapio.metodos.atualizarBadgeTotal()
                cardapio.metodos.carregarCarrinho()
                cardapio.metodos.abrirCarrinho(false)
                return
            }

            // fallback: envia para backend local
            console.log(' Backend POST /pedidos', payload)
            const resp = await fetch(`${BACKEND_URL}/pedidos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!resp.ok) {
                const txt = await resp.text().catch(() => '')
                throw new Error(`Backend error: ${resp.status} ${txt}`)
            }

            await resp.json()
            cardapio.metodos.mensagem('Pedido enviado com sucesso!', 'green')
            // abrir WhatsApp com resumo (usa o payload enviado)
            cardapio.metodos._abrirWhatsAppResumo(payload)
            // limpa carrinho e atualiza UI
            MEU_CARRINHO = []
            cardapio.metodos.atualizarBadgeTotal()
            cardapio.metodos.carregarCarrinho()
            cardapio.metodos.abrirCarrinho(false)

        } catch (err) {
            console.error('Envio de pedido falhou:', err)
            cardapio.metodos.mensagem('Falha ao enviar pedido: ' + (err.message || err), 'red', 8000)
        } finally {
            $btn.prop('disabled', false).removeClass('disabled').text(oldText)
        }
    },

    // Atualiza o link do botão do whatsapp
    finalizarPedido: () => {
        if (MEU_CARRINHO.length > 0 && MEU_ENDERECO != null) {
            // monta texto resumo (botão usa o envio real ao clicar)
            let texto = ' *NOVO PEDIDO DE AÇAÍ*\n\n';
            $.each(MEU_CARRINHO, (i, e) => {
                texto += ` *Produto:* ${e.name}\n`;
                texto += ` *Tamanho:* ${e.dsc || e.tamanho || e.size || e.tamanho_ml || '---'}\n`;
                if (e.bases && e.bases.length) texto += `*Base:* ${e.bases.join(', ')}\n`;
                if (e.frutas && e.frutas.length) texto += `*Frutas:* ${e.frutas.join(', ')}\n`;
                if (e.coberturas.length > 0) texto += `*Coberturas:* ${e.coberturas.join(', ')}\n`;
                if (e.complementos.length > 0) texto += `*Complementos:* ${e.complementos.join(', ')}\n`;
                texto += `Quantidade: ${e.qntd}  R$ ${ (e.price * e.qntd).toFixed(2).replace('.', ',')}\n\n`;
            });

            texto += `*Forma de entrega:* ${MEU_ENDERECO.forma}\n\n`;
            const subtotal = VALOR_CARRINHO;
            let descontoResumo = 0;
            if (CURRENT_CUPOM && CURRENT_CUPOM.active) {
                if (CURRENT_CUPOM.type === 'percent') descontoResumo = (CURRENT_CUPOM.value/100) * subtotal;
                else if (CURRENT_CUPOM.type === 'fixed') descontoResumo = CURRENT_CUPOM.value;
                if (descontoResumo > subtotal) descontoResumo = subtotal;
                texto += `*Cupom aplicado:* ${CURRENT_CUPOM.code} — desconto de R$ ${descontoResumo.toFixed(2).replace('.', ',')}\n`;
            }
            const displayTotal3 = Math.max(0, subtotal - descontoResumo + VALOR_ENTREGA);
            texto += `\n*Total: R$ ${displayTotal3.toFixed(2).replace('.', ',')}*\n`;
            const obsText = $('#txtObservacao').val().trim()
            if (obsText) texto += `\n*Observação:* ${obsText}\n`;

            // apenas atualiza o comportamento do botão para enviar via função (prevenir navegação)
            $("#btnEtapaEnviarResumo").attr('href', 'javascript:void(0);').off('click').on('click', (e) => {
                e.preventDefault()
                cardapio.metodos.enviarPedidoAoBackend()
            })
        }
    },

    // Abre o WhatsApp com o resumo do pedido (usa o payload enviado)
    _abrirWhatsAppResumo: (payload) => {
        const p = payload || {
            cliente: MEU_CLIENTE,
            telefone: MEU_TELEFONE,
            produtos: MEU_CARRINHO,
            total: (VALOR_CARRINHO + VALOR_ENTREGA),
            endereco: (MEU_ENDERECO && MEU_ENDERECO.forma && MEU_ENDERECO.forma.toLowerCase().includes('retirar') ? null : MEU_ENDERECO || null),
            tipo_entrega: (MEU_ENDERECO && MEU_ENDERECO.forma && MEU_ENDERECO.forma.toLowerCase().includes('retirar')) ? 'retirada' : 'delivery',
            observacao: $('#txtObservacao').val()
        }

        let texto = ''
        try {
            const subtotal = Number(p.valor_subtotal || p.subtotal || VALOR_CARRINHO || 0)
            const desconto = Number(p.valor_desconto || p.desconto || 0)
            const frete = Number(p.valor_entrega || p.valor_frete || p.frete || VALOR_ENTREGA || 0)
            const total = Number(p.total || subtotal - desconto + frete || 0)
            const cupomCodigo = p.cupom || p.cupom_codigo || p.cupom_code || null

            texto += '*🍓 NOVO PEDIDO - AÇAÍ NO GRAU | PARNAÍBA*\n'
            texto += '\n'
            texto += '*DADOS DO CLIENTE*\n'
            texto += `Nome: ${p.cliente || '---'}\n`
            texto += `Telefone: ${p.telefone || '---'}\n`

            const isRetirada = isRetiradaType(p.tipo_entrega || (p.endereco && p.endereco.forma) || p.endereco || '')
            if (isRetirada) {
                texto += '\n*LOCAL DE RETIRADA*\n'
                texto += 'Retirada no estabelecimento\n'
                texto += 'Sem necessidade de CEP ou endereço de entrega.\n'
            } else if (p.endereco) {
                if (typeof p.endereco === 'string') {
                    texto += `Endereço: ${p.endereco}\n`
                } else {
                    const e = p.endereco
                    texto += '\n*ENDEREÇO DE ENTREGA*\n'
                    if (e.endereco) texto += `Rua: ${e.endereco}\n`
                    if (e.numero) texto += `Nº: ${e.numero}\n`
                    if (e.complemento) texto += `Complemento: ${e.complemento}\n`
                    if (e.bairro) texto += `Bairro: ${e.bairro}\n`
                    if (e.cidade) texto += `Cidade: ${e.cidade}\n`
                    if (e.uf) texto += `Estado: ${e.uf}\n`
                }
            }

            texto += '\n*ITENS*\n'
            const itens = Array.isArray(p.produtos) ? p.produtos : []
            for (let idx = 0; idx < itens.length; idx++) {
                const it = itens[idx]
                const tamanho = it.dsc || it.size || it.tamanho || it.tamanho_label || it.options?.tamanho || it.options?.tamanho_label || ''
                const preco = (it.price !== undefined ? Number(it.price) : (it.unit_price_cents ? Number(it.unit_price_cents) / 100 : 0))
                const q = Number(it.qntd || it.qty || it.quantity || 1)
                const valorItem = (preco * q).toFixed(2).replace('.', ',')
                const precoUnitario = preco.toFixed(2).replace('.', ',')

                texto += `${idx + 1}) ${it.name}${tamanho ? ' (' + tamanho + ')' : ''}\n`
                texto += `   Quantidade: ${q} | Unitário: R$ ${precoUnitario} | Total: R$ ${valorItem}\n`

                const parts = []
                if (it.bases && it.bases.length) parts.push('Base: ' + it.bases.join(', '))
                if (it.frutas && it.frutas.length) parts.push('Frutas: ' + it.frutas.join(', '))
                if (it.coberturas && it.coberturas.length) parts.push('Cobertura: ' + it.coberturas.join(', '))
                if (it.complementos && it.complementos.length) parts.push('Complemento: ' + it.complementos.join(', '))
                if (it.options) {
                    if (it.options.bases && it.options.bases.length) parts.push('Base: ' + it.options.bases.join(', '))
                    if (it.options.frutas && it.options.frutas.length) parts.push('Frutas: ' + it.options.frutas.join(', '))
                    if (it.options.coberturas && it.options.coberturas.length) parts.push('Cobertura: ' + it.options.coberturas.join(', '))
                    if (it.options.complementos && it.options.complementos.length) parts.push('Complemento: ' + it.options.complementos.join(', '))
                }
                if (parts.length) texto += `   ${parts.join(' | ')}\n`
            }

            const obs = p.observacao || p.observações || $('#txtObservacao').val()
            if (obs && obs.toString().trim()) {
                texto += '\n*OBSERVAÇÃO*\n'
                texto += `${obs.toString().trim()}\n`
            }

            texto += '\n*RESUMO DE VALORES*\n'
            texto += `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`
            texto += `Desconto: R$ ${desconto.toFixed(2).replace('.', ',')}\n`
            texto += `Frete: R$ ${frete.toFixed(2).replace('.', ',')}\n`
            texto += `*Total: R$ ${total.toFixed(2).replace('.', ',')}*\n`

            if (cupomCodigo) {
                texto += `\n*Cupom aplicado*: ${cupomCodigo}\n`
            } else {
                texto += '\nCupom: não aplicado\n'
            }

            let formaEntrega = 'Delivery'
            if (p.endereco && typeof p.endereco === 'object') {
                formaEntrega = p.endereco.forma || p.endereco.tipo || p.endereco.type || formaEntrega
            } else if (p.endereco && typeof p.endereco === 'string') {
                formaEntrega = p.endereco
            }
            if (p.tipo_entrega) formaEntrega = p.tipo_entrega
            const finalIsRetirada = isRetiradaType(formaEntrega)
            texto += `\n*Forma de entrega*: ${finalIsRetirada ? 'Retirada na loja' : 'Entrega (Delivery)'}\n`

            texto += '\nPor favor, confirme o pedido.\n'
            texto += 'Obrigado!'
        } catch (err) {
            console.error('Erro ao montar mensagem WhatsApp:', err, 'payload=', p)
            cardapio.metodos.mensagem('Falha ao enviar pedido: ' + (err.message || err), 'red', 8000)
            return
        }

        const encode = encodeURIComponent(texto)
        const URL = `https://wa.me/${86994215383}?text=${encode}`
        window.open(URL, '_blank')
    },

    // Carrega o link do botão Reserva
    carregarBotaoReserva:() => {
        var texto = 'Ol! Gostaria de fazer uma *reserva*.'

        let encode = encodeURI(texto)
        let URL = `https://wa.me/${86994215383}?text=${encode}`

        $("#btnReserva").attr('href', URL)

    },

    // Carrega o botão de ligar
    carregarBotaoLigar: () => {
        $('#btnLigar').attr('href', `tel:${86994215383}`)

    },

    // Carrega o botão do Whatsapp
    carregarBotaoWhatsapp: () => {
        var texto = 'Ol! Gostaria de fazer um *pedido*.'
        let encode = encodeURI(texto)
        let URL = `https://wa.me/${86994215383}?text=${encode}`

        $('#btnWhatsapp').attr('href', URL)
        $('#btnWhatsappFooter').attr('href', URL)
        
    },
    

    // Abre o depoimento
    abrirDepoimento: (depoimento) => {
        $('#depoimento-1').addClass('hidden')
        $('#depoimento-2').addClass('hidden')
        $('#depoimento-3').addClass('hidden')

        $('#btnDepoimento-1').removeClass('active')
        $('#btnDepoimento-2').removeClass('active')
        $('#btnDepoimento-3').removeClass('active')

        $('#depoimento-' + depoimento).removeClass('hidden')
        $('#btnDepoimento-' + depoimento).addClass('active')
    },
    



    // Mensagens 
    mensagem: (texto, cor = 'red', tempo = 3500) => {
        let id = Math.floor(Date.now() * Math.random().toString())

        let msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`

        $("#container-mensagens").append(msg)

        setTimeout(() => {
            $("#msg-" + id).removeClass('fadeInDown')
            $("#msg-" + id).addClass('fadeOutUp')
            setTimeout(() => {
                $("#msg-" + id).remove()
            }, 800)
        }, tempo)
    }
}

cardapio.templates = {
    item: `
    <div class="col-12 col-lg-3 col-md-3 col-sm-6 mb-5 scroll-animate card-scroll fade-up scroll-animate-normal">
    <div class="card card-item" id="\${id}">
        <div class="img-produto">
            <img src="\${img}"
                alt="">
        </div>
        <p class="title-produto text-center mt-4">
            <strong>\${nome}</strong>
        </p>
        <p class="price-produto text-center">
            <strong>R$ \${preco}</strong>
        </p>
        <div class="add-carrinho">
            <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidade('\${id}')"><i class="fas fa-minus"></i></span>
            <span class="add-numero-itens" id="qntd-\${id}">0</span>
            <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidade('\${id}')"><i class="fas fa-plus"></i></span>
            <span class="btn btn-add" onclick="cardapio.metodos.adicionarAoCarrinho('\${id}')"><i class="fa fa-shopping-bag"></i></span>
        </div>
    </div>
</div>
    `,

    itemCarrinho: `
    <div class="col-12 item-carrinho scroll-animate list-item-animate fade-up scroll-animate-normal">
        <div class="img-produto">
            <img src="\${img}" alt="">
        </div>
        <div class="dados-produto">
            <p class="title-produto"><strong>\${nome}</strong></p>
            <p class="price-produto"><strong>R$ \${preco}</strong></p>
            <a class="btn btn-yellow btn-sm mt-2 btn-escolher-ingredientes" onclick="cardapio.metodos.abrirModalIngredientes('\${id}')">Escolher ingredientes</a>
        </div>
        <div class="add-carrinho">
            <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidadeCarrinho('\${id}')"><i class="fas fa-minus"></i></span>
            <span class="add-numero-itens" id="qntd-carrinho-\${id}">\${qntd}</span>
            <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidadeCarrinho('\${id}')"><i class="fas fa-plus"></i></span>
            <span class="btn btn-remove no-mobile"><i class="fa fa-times" onclick="cardapio.metodos.removerItemCarrinho('\${id}')"></i></span>
        </div>
    </div>
    `,

    itemResumo: `
    <div class="col-12 item-carrinho resumo scroll-animate list-item-animate fade-up scroll-animate-normal">
        <div class="img-produto-resumo">
            <img src="\${img}">
        </div>

        <div class="dados-produto">
            <p class="title-produto-resumo">
                <strong>\${nome}</strong>
            </p>
            <p class="price-produto-resumo">
                <strong>R$ \${preco}</strong>
            </p>
        </div>

        <p class="quantidade-produto-resumo">x <strong>\${qntd}</strong></p>
    </div>
    `
}












