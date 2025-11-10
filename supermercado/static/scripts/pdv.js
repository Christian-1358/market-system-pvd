   let todosOsProdutos = [];  
    let carrinho = [];
    let descontoPercent = 0;
    let historicoVendas = []; 
    let proximoNumeroVenda = 1;
    const formatarMoeda = (valor) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    function calcularTroco(valorTotal, valorPago) {
        let troco = valorPago - valorTotal;

        if (troco < -0.01) return { troco: troco, detalhe: 'Valor pago insuficiente.' };

        if (troco < 0) troco = 0;

        const cedulas = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];
        const cedulasR = [100, 50, 20, 10, 5, 2, 1, 0.50, 0.25, 0.10, 0.05, 0.01];
        let trocoCentavos = Math.round(troco * 100);
        let detalhe = [];

        for (let i = 0; i < cedulas.length; i++) {
            const cedulaCentavos = cedulas[i];
            const cedulaReal = cedulasR[i];

            if (trocoCentavos >= cedulaCentavos) {
                let quantidade = Math.floor(trocoCentavos / cedulaCentavos);
                trocoCentavos -= quantidade * cedulaCentavos;

                let tipo = cedulaReal >= 1 ? `R$ ${cedulaReal.toFixed(2)}` : `R$ ${cedulaReal.toFixed(2).replace('0.', '')}`;

                detalhe.push(`${quantidade}x ${tipo}`);
            }
        }

        return { troco: troco, detalhe: detalhe.join(', ') };
    }


    function calcularTotalVenda() {
        const subtotal = carrinho.reduce((acc,i)=>acc+(i.quantidade*i.preco_unitario),0);
        return subtotal * (1 - descontoPercent / 100);
    }

    function recalcularTotais() {
        const subtotal = carrinho.reduce((acc,i)=>acc+(i.quantidade*i.preco_unitario),0);
        const totalComDesconto = calcularTotalVenda();

        document.getElementById('subtotal-display').textContent = formatarMoeda(subtotal);
        document.getElementById('desconto-print').textContent = `${descontoPercent || 0}%`;
        document.getElementById('total-venda-display').textContent = formatarMoeda(totalComDesconto);

        renderizarItensCarrinho();
    }

    function abrirModalPagamento() {
        if(carrinho.length === 0){
            mostrarMensagemAviso("Carrinho vazio! Adicione itens para finalizar.");
            return;
        }

        const totalVenda = calcularTotalVenda();
        document.getElementById('modal-total-venda').textContent = formatarMoeda(totalVenda);

        document.getElementById('input-dinheiro').value = totalVenda.toFixed(2);
        document.getElementById('input-cartao').value = '0.00';
        document.getElementById('input-pix').value = '0.00';

        calcularModalTroco();

        document.getElementById('modal-pagamento-overlay').style.display = 'flex';
        document.getElementById('input-dinheiro').focus();
    }

    function fecharModalPagamento() {
        document.getElementById('modal-pagamento-overlay').style.display = 'none';
    }

    function calcularModalTroco() {
        const totalVenda = calcularTotalVenda();
        const dinheiro = parseFloat(document.getElementById('input-dinheiro').value) || 0;
        const cartao = parseFloat(document.getElementById('input-cartao').value) || 0;
        const pix = parseFloat(document.getElementById('input-pix').value) || 0;

        const totalPago = dinheiro + cartao + pix;
        const restantePagar = totalVenda - totalPago;

        document.getElementById('modal-total-pago').textContent = formatarMoeda(totalPago);

        const btnFinalizar = document.getElementById('btn-finalizar-pagamento');
        const restanteDisplay = document.getElementById('modal-restante-pagar');
        const trocoDisplay = document.getElementById('modal-troco-valor');
        const trocoDetalheDiv = document.getElementById('modal-troco-detalhe');

        restanteDisplay.classList.remove('restante-valor');
        restanteDisplay.style.color = 'var(--text-color)';
        trocoDetalheDiv.innerHTML = '';


        if (restantePagar > 0.01) {
            restanteDisplay.textContent = formatarMoeda(restantePagar);
            restanteDisplay.classList.add('restante-valor');
            restanteDisplay.style.color = 'var(--cancel-color)';
            trocoDisplay.textContent = formatarMoeda(0);
            btnFinalizar.disabled = true;
        } else {
            restanteDisplay.textContent = formatarMoeda(0);
            btnFinalizar.disabled = false;

            const troco = totalPago - totalVenda;
            const { troco: trocoCalculado, detalhe } = calcularTroco(totalVenda, totalPago);

            if (troco > 0.01) {
                trocoDisplay.textContent = formatarMoeda(trocoCalculado);
                trocoDetalheDiv.innerHTML = 'Notas/Moedas: ' + detalhe;
            } else {
                trocoDisplay.textContent = formatarMoeda(0);
            }
        }
    }   
    // Aqui fica o Banco de dados
    function carregarProdutos() {
        fetch("/pvd/produtos")
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    todosOsProdutos = data;
                    renderizarCatalogo(todosOsProdutos);
                } else {
                    mostrarMensagemAviso("O servidor não retornou produtos válidos.");
                }
            })
            .catch(err => {
                console.error("Erro ao carregar produtos:", err);
                mostrarMensagemErro("⚠️ Erro ao carregar catálogo. Verifique o servidor ou a URL: /pvd/produtos");
            });
    }

    function mostrarMensagemAviso(texto) {
        const rightPanel = document.getElementById('cart-right-panel');
        const msgExistente = document.querySelector(".msg-aviso");
        if (msgExistente) msgExistente.remove();
        const aviso = document.createElement("div");
        aviso.classList.add("msg-aviso");
        aviso.textContent = texto;
        rightPanel.prepend(aviso);
        setTimeout(() => aviso.remove(), 3000);
    }

    function mostrarMensagemErro(texto) {
        const grupoBusca = document.querySelector(".search-group");
        const msgExistente = document.querySelector(".msg-erro");
        if (msgExistente) msgExistente.remove();
        const msg = document.createElement("div");
        msg.classList.add("msg-erro");
        msg.textContent = texto;

        msg.style.color = "#fff";
        msg.style.backgroundColor = "#d9534f";
        msg.style.padding = "8px 12px";
        msg.style.borderRadius = "6px";
        msg.style.fontWeight = "600";
        msg.style.marginBottom = "10px";
        msg.style.textAlign = "center";
        msg.style.animation = "fadeInOut 3s forwards";

        grupoBusca.parentNode.insertBefore(msg, grupoBusca);
        setTimeout(() => msg.remove(), 3000);
    }

    function adicionarItemPeloCodigo(codigoBarras, quantidade) {
        const codigoInput = document.getElementById('codigo_barras_input');
        const qtdInput = document.getElementById('quantidade-input');

        if (!codigoBarras) { codigoInput.focus(); return; }

        if (codigoBarras.includes("*")) {
            let temp = codigoBarras.split("*");
            codigoBarras = temp[1];
            quantidade = parseInt(temp[0], 10) || quantidade;
        }

        quantidade = parseInt(quantidade, 10) || 1;
        const produto = todosOsProdutos.find(p => p.codigo_barras === codigoBarras);

        if (!produto) {
            codigoInput.value = '';
            mostrarMensagemErro("Produto não encontrado!");
            codigoInput.focus();
            return;
        }

        if (produto.estoque < quantidade) {
            mostrarMensagemErro(`Estoque insuficiente! Restam ${produto.estoque}.`);
            codigoInput.focus();
            return;
        }

        const itemExistente = carrinho.find(i => i.codigo_barras === codigoBarras);

        if (itemExistente) itemExistente.quantidade += quantidade;
        else carrinho.push({ ...produto, quantidade, preco_unitario: produto.preco });

        produto.estoque -= quantidade;

        recalcularTotais();
        renderizarCatalogo(todosOsProdutos);

        codigoInput.value = '';
        qtdInput.value = '1';
        codigoInput.focus();
    }

    function removerItem(codigo) {
        const index = carrinho.findIndex(i => i.codigo_barras === codigo);
        if(index !== -1){
            const itemRemovido = carrinho[index];
            const produto = todosOsProdutos.find(p=>p.codigo_barras===codigo);
            if(produto) produto.estoque += itemRemovido.quantidade;
            carrinho.splice(index,1);
            recalcularTotais();
            renderizarCatalogo(todosOsProdutos);
            mostrarMensagemAviso(`Item ${itemRemovido.nome} removido.`);
        }
    }

    function ajustarQuantidade(codigo, delta) {
        const item = carrinho.find(i => i.codigo_barras === codigo);
        const produtoOriginal = todosOsProdutos.find(p => p.codigo_barras === codigo);
        
        if (!item || !produtoOriginal) return;

        const novaQuantidade = item.quantidade + delta;

        if (novaQuantidade <= 0) {
            removerItem(codigo);
            return;
        }

        if (delta > 0 && produtoOriginal.estoque < delta) {
            mostrarMensagemErro(`Estoque insuficiente! Restam ${produtoOriginal.estoque}.`);
            return;
        }

        produtoOriginal.estoque -= delta;
        item.quantidade = novaQuantidade;

        recalcularTotais();
        renderizarCatalogo(todosOsProdutos);
    }

    function abrirEdicaoPreco(codigo, precoAtual) {
        const novoPrecoStr = prompt(`Digite o novo preço un itário para o item ${codigo}:`, precoAtual.toFixed(2));
        
        if (novoPrecoStr === null) return;
        
        const novoPreco = parseFloat(novoPrecoStr.replace(',', '.'));

        if (isNaN(novoPreco) || novoPreco < 0) {
            mostrarMensagemErro("Preço inválido.");
            return;
        }

        const item = carrinho.find(i => i.codigo_barras === codigo);
        if (item) {
            item.preco_unitario = novoPreco;
            recalcularTotais();
            mostrarMensagemAviso(`Preço do item ${item.nome} ajustado para ${formatarMoeda(novoPreco)}.`);
        }
    }

    function renderizarItensCarrinho() {
        const rightPanel = document.getElementById('cart-right-panel');
        const totaisDiv = rightPanel.querySelector('.total-parcial-group');

        rightPanel.querySelectorAll('.cart-item, #empty-cart-msg').forEach(el => {
            if (el !== totaisDiv && el !== rightPanel.querySelector('.botoes-finalizar')) {
                el.remove();
            }
        });

        if(carrinho.length === 0){
            const emptyMsg = document.createElement('p');
            emptyMsg.id = 'empty-cart-msg';
            emptyMsg.textContent = 'Nenhum item no carrinho.';
            rightPanel.insertBefore(emptyMsg, rightPanel.firstChild);
            return;
        }

        carrinho.forEach(item => {
            const totalItem = item.quantidade * item.preco_unitario;
            const div = document.createElement('div');
            div.classList.add('cart-item');
            
            const produtoOriginal = todosOsProdutos.find(p=>p.codigo_barras===item.codigo_barras);
            if(produtoOriginal && produtoOriginal.estoque < 5) div.classList.add('low-stock');

            div.innerHTML = `
                <div style="flex-grow: 1;">
                    <span style="font-weight: 600;">${item.nome}</span>
                    <div style="font-size: 0.9em; color: #555;">
                        (${formatarMoeda(item.preco_unitario)}/un) Total: ${formatarMoeda(totalItem)}
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 5px;">
                    <button onclick="ajustarQuantidade('${item.codigo_barras}', -1)" style="background-color: #777; width: 25px; padding: 4px;"><i class="fas fa-minus"></i></button>
                    <span id="qtd-item-${item.codigo_barras}" style="min-width: 30px; text-align: center;">${item.quantidade}</span>
                    <button onclick="ajustarQuantidade('${item.codigo_barras}', 1)" style="background-color: var(--total-color); width: 25px; padding: 4px;"><i class="fas fa-plus"></i></button>
                </div>
                
                <button onclick="abrirEdicaoPreco('${item.codigo_barras}', ${item.preco_unitario})" style="background-color: var(--accent-color); margin-left: 10px; width: 30px; padding: 4px;">
                    <i class="fas fa-tags"></i>
                </button>
                
                <button onclick="removerItem('${item.codigo_barras}')" style="background-color: var(--cancel-color); margin-left: 10px; width: 30px; padding: 4px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            rightPanel.insertBefore(div, rightPanel.querySelector('.total-parcial-group'));
        });
    }

    function renderizarCatalogo(produtos) {
        const tbody = document.querySelector('#tabela-catalogo tbody');
        tbody.innerHTML='';
        if(produtos.length===0){
            tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:#777;">Nenhum produto encontrado.</td></tr>';
            return;
        }
        produtos.forEach(prod=>{
            const tr=document.createElement('tr');
            const precoFormatado = prod.preco.toLocaleString('pt-BR',{minimumFractionDigits:2});
            const estoqueEsgotado = prod.estoque<=0;
            tr.innerHTML=`<td>${prod.codigo_barras}</td><td>${prod.nome}</td><td class="text-right">R$ ${precoFormatado}</td><td class="text-center"><button class="btn-adicionar-catalogo" data-codigo="${prod.codigo_barras}" ${estoqueEsgotado?'disabled':''}>+</button></td>`;
            if(prod.estoque<5 && !estoqueEsgotado) tr.style.backgroundColor='var(--low-stock-bg)';
            tbody.appendChild(tr);
        });
    }

    function filtrarCatalogo() {
        const termo = document.getElementById('filtro-produtos').value.toLowerCase();
        const filtrados = todosOsProdutos.filter(p=>p.nome.toLowerCase().includes(termo) || (p.codigo_barras && p.codigo_barras.includes(termo)));
        renderizarCatalogo(filtrados);
    }


    function finalizarCompraConfirmada() { //função do dinheiro
        const totalVenda = calcularTotalVenda();
        const dinheiro = parseFloat(document.getElementById('input-dinheiro').value) || 0;
        const cartao = parseFloat(document.getElementById('input-cartao').value) || 0;
        const pix = parseFloat(document.getElementById('input-pix').value) || 0;
        const valorPagoTotal = dinheiro + cartao + pix;

        if (valorPagoTotal < totalVenda - 0.01) {
            mostrarMensagemErro("Pagamento insuficiente! Verifique o modal de checkout.");
            return;
        }

        fecharModalPagamento();

        const dataAtual = new Date().toLocaleString('pt-BR');
        const troco = valorPagoTotal - totalVenda;
        const { detalhe } = calcularTroco(totalVenda, valorPagoTotal);

        const novaVenda = {
            id: proximoNumeroVenda++,
            data: dataAtual,
            subtotal: carrinho.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0),
            descontoPercent: descontoPercent,
            totalVenda: totalVenda,
            totalPago: valorPagoTotal,
            troco: Math.max(0, troco),
            metodos: { dinheiro, cartao, pix },
            itens: JSON.parse(JSON.stringify(carrinho))
        };
        historicoVendas.push(novaVenda);

        
        document.querySelector('.recibo-header h1').textContent = `RECIBO DE COMPRA (#${novaVenda.id})`; 
        document.getElementById('recibo-data').textContent = dataAtual;
        document.getElementById('recibo-subtotal').textContent = formatarMoeda(novaVenda.subtotal);
        document.getElementById('recibo-desconto').textContent = `${novaVenda.descontoPercent}%`;
        document.getElementById('recibo-total').textContent = formatarMoeda(novaVenda.totalVenda);
        document.getElementById('recibo-pago').textContent = formatarMoeda(valorPagoTotal);
        document.getElementById('recibo-troco').textContent = formatarMoeda(novaVenda.troco);
        document.getElementById('recibo-troco-detalhe').innerHTML = 'Troco em: ' + detalhe.split(', ').join('<br>');

        const reciboItensDiv = document.getElementById('recibo-itens');
        reciboItensDiv.innerHTML = '';
        novaVenda.itens.forEach(item => {
            const itemHtml = document.createElement('div');
            itemHtml.classList.add('recibo-item');
            const itemDesc = `${item.nome} (${item.quantidade} x ${formatarMoeda(item.preco_unitario)})`;
            const itemTotal = formatarMoeda(item.quantidade * item.preco_unitario);
            itemHtml.innerHTML = `
                <span>${itemDesc}</span>
                <span class="recibo-item-price">${itemTotal}</span>
                <div style="clear: both;"></div>
            `;
            reciboItensDiv.appendChild(itemHtml);
        });

        const reciboPagamentosDiv = document.getElementById('recibo-pagamentos-detalhe');
        reciboPagamentosDiv.innerHTML = '';
        if (dinheiro > 0.01) reciboPagamentosDiv.innerHTML += `<div class="recibo-total-item" style="border-top: none; font-size: 0.9em; font-weight: normal;"><span>Dinheiro:</span><span>${formatarMoeda(dinheiro)}</span></div>`;
        if (cartao > 0.01) reciboPagamentosDiv.innerHTML += `<div class="recibo-total-item" style="border-top: none; font-size: 0.9em; font-weight: normal;"><span>Cartão:</span><span>${formatarMoeda(cartao)}</span></div>`;
        if (pix > 0.01) reciboPagamentosDiv.innerHTML += `<div class="recibo-total-item" style="border-top: none; font-size: 0.9em; font-weight: normal;"><span>PIX:</span><span>${formatarMoeda(pix)}</span></div>`;

        mostrarMensagemAviso(`Venda #${novaVenda.id} finalizada! Troco: ${formatarMoeda(novaVenda.troco)}`);

        window.onafterprint = () => {
            carrinho = [];
            descontoPercent = 0;
            document.getElementById('desconto-input').value = '0';
            recalcularTotais();
            carregarProdutos(); 
            window.onafterprint = null;
        };

        window.print();
    }

    function fecharCaixa() {
        if (historicoVendas.length === 0) {
            mostrarMensagemAviso("Nenhuma venda registrada desde a abertura do PDV.");
            return;
        }

        const resumo = historicoVendas.reduce((acc, venda) => {
            acc.totalVendas++;
            acc.totalBruto += venda.subtotal;
            acc.totalLiquido += venda.totalVenda;
            acc.metodos.dinheiro += venda.metodos.dinheiro;
            acc.metodos.cartao += venda.metodos.cartao;
            acc.metodos.pix += venda.metodos.pix;
            return acc;
        }, {
            totalVendas: 0,
            totalBruto: 0,
            totalLiquido: 0,
            metodos: { dinheiro: 0, cartao: 0, pix: 0 }
        });

        const detalheMetodos = `
    DINHEIRO: ${formatarMoeda(resumo.metodos.dinheiro)}
    CARTÃO:   ${formatarMoeda(resumo.metodos.cartao)}
    PIX:      ${formatarMoeda(resumo.metodos.pix)}
    ------------------------------
    TOTAL RECEBIDO: ${formatarMoeda(resumo.metodos.dinheiro + resumo.metodos.cartao + resumo.metodos.pix)}`;

        const mensagem = `
*** RELATÓRIO DE FECHAMENTO DE CAIXA ***
Vendas: ${resumo.totalVendas} (#${historicoVendas[0].id} a #${historicoVendas[historicoVendas.length - 1].id})

TOTAL BRUTO: ${formatarMoeda(resumo.totalBruto)}
DESCONTO:    ${formatarMoeda(resumo.totalBruto - resumo.totalLiquido)}
TOTAL LÍQUIDO: ${formatarMoeda(resumo.totalLiquido)}

${detalheMetodos}

==============================
VALOR A CONFERIR NO CAIXA:
Dinheiro Recebido: ${formatarMoeda(resumo.metodos.dinheiro)}
`;

        alert(mensagem);
        
           mostrarMensagemAviso("Caixa zerado com sucesso. Novo turno iniciado.");
      }
    
  
    function cancelarCompra() {
        if(carrinho.length === 0){
            mostrarMensagemAviso("Carrinho já está vazio.");
            return;
        }

        carrinho.forEach(item => {
            const produto = todosOsProdutos.find(p => p.codigo_barras === item.codigo_barras);
            if(produto) produto.estoque += item.quantidade;
        });

        carrinho = [];
        descontoPercent = 0;
        document.getElementById('desconto-input').value = '0';
        recalcularTotais();
        renderizarCatalogo(todosOsProdutos);
        mostrarMensagemAviso("Compra cancelada! Estoque restaurado.");
    }

    document.addEventListener('DOMContentLoaded',()=>{
        carregarProdutos();
        recalcularTotais();
    });

    document.getElementById('add-item-btn').addEventListener('click',()=>{
        const codigo = document.getElementById('codigo_barras_input').value.trim();
        const quantidade = parseInt(document.getElementById('quantidade-input').value, 10);

        if (codigo && quantidade > 0) {
            adicionarItemPeloCodigo(codigo, quantidade);
        } else {
            mostrarMensagemErro("Preencha o código e a quantidade!");
        }
    });

    document.addEventListener('click',event=>{
        if(event.target.classList.contains('btn-adicionar-catalogo')){
            const codigo = event.target.getAttribute('data-codigo');
            adicionarItemPeloCodigo(codigo,1);
        }
    });
    document.addEventListener("DOMContentLoaded", function() {
    // Todos os seus event listeners
    document.getElementById("add-item-btn").addEventListener("click", function() {
        console.log("Adicionar clicado");
    });
    document.getElementById("finalizar-btn").addEventListener("click", function() {
        console.log("Finalizar clicado");
    });
    document.getElementById("cancelar-btn").addEventListener("click", function() {
        console.log("Cancelar clicado");
    });
    document.getElementById("aplicar-desconto-btn").addEventListener("click", function() {
        console.log("Aplicar desconto clicado");
    });
});

    
    document.getElementById('finalizar-btn').addEventListener('click', abrirModalPagamento);
    document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModalPagamento);
    document.getElementById('btn-finalizar-pagamento').addEventListener('click', finalizarCompraConfirmada);
    document.getElementById('cancelar-btn').addEventListener('click', cancelarCompra);
    document.getElementById('aplicar-desconto-btn').addEventListener('click', () => {
        let novoDesconto = parseFloat(document.getElementById('desconto-input').value);
        if (isNaN(novoDesconto) || novoDesconto < 0 || novoDesconto > 100) {
            mostrarMensagemErro("Desconto inválido!");
            document.getElementById('desconto-input').value = descontoPercent;
            return;
        }
        descontoPercent = novoDesconto;
        recalcularTotais();
        mostrarMensagemAviso(`Desconto de ${descontoPercent}% aplicado.`);
    });




        
    function limparCarrinho() {
        carrinho = [];
        recalcularTotais();
        document.getElementById('empty-cart-msg').textContent = 'Carrinho limpo (F2).';
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault(); 
            limparCarrinho();
        }
    });
function calcularTotal(desconto = 0) {
  let total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  if (desconto > 0) {
    const valorDesconto = (total * desconto) / 100;
    total -= valorDesconto;
    mostrarMensagemAviso(`Desconto de ${desconto}% aplicado (-R$ ${valorDesconto.toFixed(2)})`);
  }

  return total;
}

const totalComDesconto = calcularTotal();


console.log("Total com desconto:", totalComDesconto);
document.addEventListener("keydown", (e) => {
  if (e.key === "F3") {
    e.preventDefault();
    const valor = prompt("Digite o desconto (%):");
    if (valor !== null) {
      const total = calcularTotal(parseFloat(valor));
      document.getElementById('total').textContent = total.toFixed(2);
    }
  }
});


function aplicarDesconto() {
  const valor = parseFloat(document.getElementById('desconto').value) || 0;
  const total = calcularTotal(valor);
  document.getElementById('total').textContent = total.toFixed(2);
}
function adicionarProduto(codigoBarras, quantidade = 1) {
    const produto = todosOsProdutos.find(p => p.codigo_barras === codigoBarras);
    if (!produto) return mostrarMensagemErro("Produto não encontrado!");

    if (produto.estoque < quantidade) return mostrarMensagemErro(`Estoque insuficiente! Restam ${produto.estoque}`);

    const itemExistente = carrinho.find(i => i.codigo_barras === codigoBarras);
    if (itemExistente) itemExistente.quantidade += quantidade;
    else carrinho.push({ ...produto, quantidade, preco_unitario: produto.preco });

    produto.estoque -= quantidade;
    recalcularTotais();
    renderizarCatalogo(todosOsProdutos);
}
function calcularTotalCarrinho(desconto = descontoPercent) {
    const subtotal = carrinho.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0);
    const totalComDesconto = subtotal * (1 - desconto / 100);
    return totalComDesconto;
}
function finalizarCompra() {
    if(carrinho.length === 0) return mostrarMensagemAviso("Carrinho vazio!");

    const totalVenda = calcularTotalCarrinho();
    const dinheiro = parseFloat(document.getElementById('input-dinheiro').value) || 0;
    const cartao = parseFloat(document.getElementById('input-cartao').value) || 0;
    const pix = parseFloat(document.getElementById('input-pix').value) || 0;

    const totalPago = dinheiro + cartao + pix;
    if(totalPago < totalVenda - 0.01) return mostrarMensagemErro("Pagamento insuficiente!");

    const { troco, detalhe } = calcularTroco(totalVenda, totalPago);

        historicoVendas.push({
        id: proximoNumeroVenda++,
        data: new Date().toLocaleString('pt-BR'),
        subtotal: carrinho.reduce((acc,i)=>acc+i.quantidade*i.preco_unitario,0),
        descontoPercent,
        totalVenda,
        totalPago,
        troco,
        metodos: { dinheiro, cartao, pix },
        itens: JSON.parse(JSON.stringify(carrinho))
    });

    mostrarMensagemAviso(`Venda finalizada! Troco: ${formatarMoeda(troco)}`);
document.addEventListener('keydown',(e)=>{

});

    carrinho = [];
    descontoPercent = 0;
    document.getElementById('desconto-input').value = '0';
    recalcularTotais();
    carregarProdutos();
}
