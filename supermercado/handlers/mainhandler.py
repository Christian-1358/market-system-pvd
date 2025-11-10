
import tornado.web #separ
import json
import uuid
from datetime import datetime
import sqlite3
from .produtohandler import (
    add_produto,
    get_all_produtos,   
    remove_estoque,
    add_estoque,
    get_produto_por_codigo,  
    buscar_todos_produtos,
)

active_carts = {} 

class ProdutosApiHandler(tornado.web.RequestHandler):
    def get(self):
        conn = sqlite3.connect("supermercado.db")
        cursor = conn.cursor()
        cursor.execute("SELECT codigo_barras, nome, preco, estoque FROM produtos")
        produtos = [
            {"codigo_barras": row[0], "nome": row[1], "preco": row[2], "estoque": row[3]}
            for row in cursor.fetchall()
        ]
        conn.close()
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps(produtos))

class MainHandler(tornado.web.RequestHandler):
    """Redireciona a rota principal para a página de produtos."""
    def get(self):
        self.redirect("/produtos", permanent=False)


class ProdutoHandler(tornado.web.RequestHandler):
    """Handler para CRUD de Produtos (Cadastro e Listagem)."""
    
    def get(self):
        produtos = get_all_produtos()
        mensagem = self.get_argument("msg", "") 
        self.render("produtos.html", produtos=produtos, mensagem=mensagem)

    def post(self):
        try:
            nome = self.get_argument("nome")
            preco = float(self.get_argument("preco"))
            codigo_barras = self.get_argument("codigo_barras")
            estoque = int(self.get_argument("estoque"))
        except (ValueError, tornado.web.MissingArgumentError):
            self.redirect(f"/produtos?msg=Erro: Preencha todos os campos corretamente.")
            return

        success, msg = add_produto(nome, preco, codigo_barras, estoque)
        self.redirect(f"/produtos?msg={msg}")


class RetiradaHandler(tornado.web.RequestHandler):
    """Handler para simular a retirada (venda rápida/baixa) de um produto."""
    
    def post(self):
        quantidade = 1 
        
        try:
            codigo_barras = self.get_argument("codigo_barras")
        except tornado.web.MissingArgumentError:
            self.redirect(f"/produtos?msg=Erro: O campo do código de barras não pode estar vazio.")
            return

        success, msg = remove_estoque(codigo_barras, quantidade)
        self.redirect(f"/produtos?msg={msg}")
       

class RecebimentoHandler(tornado.web.RequestHandler):
    """Handler para simular o recebimento (adição) de estoque."""
    
    def post(self):
        try:
            codigo_barras = self.get_argument("codigo_barras")
            quantidade = int(self.get_argument("quantidade")) 
        except (ValueError, tornado.web.MissingArgumentError):
            self.redirect(f"/produtos?msg=Erro: Código ou Quantidade inválida.")
            return

        success, msg = add_estoque(codigo_barras, quantidade)
        self.redirect(f"/produtos?msg={msg}")


class PdvHandler(tornado.web.RequestHandler):
    """Handler para a interface principal do Ponto de Venda (PDV) e adição de item."""
    
    def get(self):
        session_id = self.get_secure_cookie("pdv_session_id")
        if not session_id:
            session_id = str(uuid.uuid4()).encode()
            self.set_secure_cookie("pdv_session_id", session_id)
            
        session_id_str = session_id.decode()

        cart = active_carts.get(session_id_str, [])
        total_venda = sum(item['subtotal'] for item in cart)

        mensagem = self.get_argument("msg", "") 

        self.render(
            "pvd.html", 
            cart_items=cart, 
            total_venda=total_venda, 
            mensagem=mensagem,
            session_id=session_id_str,
            datetime=datetime 
        )

    def post(self):
        """Adiciona um item ao carrinho via formulário."""
       
        session_id = self.get_secure_cookie("pdv_session_id")
        if not session_id:
            self.redirect("/pdv?msg=Erro: Sessão do PDV não encontrada.")
            return
        
        session_id_str = session_id.decode()

        codigo_barras = self.get_argument("codigo_barras", None)
        quantidade_str = self.get_argument("quantidade", "1") 
        
        if not codigo_barras:
            self.redirect("/pdv?msg=Erro: Código de barras não fornecido.")
            return

        try:
            quantidade = int(quantidade_str)
            if quantidade <= 0:
                self.redirect("/pdv?msg=Erro: Quantidade inválida.")
                return
        except ValueError:
            self.redirect("/pdv?msg=Erro: Quantidade inválida.")
            return

        produto_encontrado = get_produto_por_codigo(codigo_barras)

        if not produto_encontrado:
            self.redirect("/pdv?msg=Erro: Produto não encontrado.")
            return
        
        if produto_encontrado['estoque'] < quantidade:
            self.redirect(
                f"/pdv?msg=Erro: Estoque insuficiente para {produto_encontrado['nome']}. Disponível: {produto_encontrado['estoque']}"
            )
            return

        cart = active_carts.get(session_id_str, [])
        item_existente = next((item for item in cart if item['codigo_barras'] == codigo_barras), None)

        if item_existente:
            item_existente['quantidade'] += quantidade
            item_existente['subtotal'] = item_existente['quantidade'] * item_existente['preco_unitario']
        else:\
            cart.append({
                'id': produto_encontrado['id'],
                'nome': produto_encontrado['nome'],
                'codigo_barras': produto_encontrado['codigo_barras'],
                'preco_unitario': produto_encontrado['preco'],
                'quantidade': quantidade,
                'subtotal': quantidade * produto_encontrado['preco']
            })
        
        active_carts[session_id_str] = cart 

        self.redirect(f"/pdv?msg=Item adicionado: {produto_encontrado['nome']} x {quantidade}")


class FinalizarVendaHandler(tornado.web.RequestHandler):
    """Processa a venda, baixa o estoque e limpa o carrinho."""

    def post(self):
        session_id = self.get_secure_cookie("pdv_session_id")
        if not session_id:
            self.redirect("/pdv?msg=Erro: Sessão do PDV não encontrada.")
            return
        session_id_str = session_id.decode()

        cart = active_carts.get(session_id_str, [])
        if not cart:
            self.redirect("/pdv?msg=Erro: Carrinho vazio. Adicione itens para finalizar a venda.")
            return

        total_venda = sum(item['subtotal'] for item in cart)

        venda_bem_sucedida = True
        mensagens_venda = []

        for item in cart:
            success, msg = remove_estoque(item['codigo_barras'], item['quantidade'])
            if not success:
                venda_bem_sucedida = False
                mensagens_venda.append(f"Erro ao baixar estoque de {item['nome']}: {msg}")

        if venda_bem_sucedida:
            active_carts[session_id_str] = [] 
            
            total_formatado = f"R$ {total_venda:.2f}".replace('.', ',')
            self.redirect(f"/pdv?msg=Venda finalizada com sucesso! Total: {total_formatado}")
        else:
            self.redirect("/pdv?msg=Erro ao finalizar venda: " + " ".join(mensagens_venda))


class CancelarPedidoHandler(tornado.web.RequestHandler):
    """Handler para cancelar o pedido atual (esvaziar o carrinho)."""

    def post(self):
        session_id = self.get_secure_cookie("pdv_session_id")
        if not session_id:
            self.redirect("/pdv?msg=Erro: Sessão do PDV não encontrada.")
            return

        session_id_str = session_id.decode()

        if session_id_str in active_carts:
            active_carts[session_id_str] = []
            self.redirect("/pdv?msg=Pedido cancelado e carrinho esvaziado com sucesso.")
        else:
            self.redirect("/pdv?msg=Aviso: Nenhum pedido ativo para cancelar.")


class RemoverItemHandler(tornado.web.RequestHandler):
    """Handler para remover um item específico ou parte dele do carrinho (PDV)."""

    def post(self):
        session_id = self.get_secure_cookie("pdv_session_id")
        if not session_id:
            self.redirect("/pdv?msg=Erro: Sessão do PDV não encontrada.")
            return
        session_id_str = session_id.decode()

        codigo_barras = self.get_argument("codigo_barras", None)
        quantidade_str = self.get_argument("quantidade", "1")
        
        if not codigo_barras:
            self.redirect("/pdv?msg=Erro: Código de barras não fornecido para remoção.")
            return
            
        try:
            quantidade_a_remover = int(quantidade_str)
            if quantidade_a_remover <= 0:
                 self.redirect("/pdv?msg=Erro: Quantidade de remoção inválida.")
                 return
        except ValueError:
            self.redirect("/pdv?msg=Erro: Quantidade de remoção inválida.")
            return

        cart = active_carts.get(session_id_str, [])
        item_existente_index = -1
        
        for i, item in enumerate(cart):
            if item['codigo_barras'] == codigo_barras:
                item_existente_index = i
                break

        if item_existente_index == -1:
            self.redirect("/pdv?msg=Erro: Item não encontrado no carrinho.")
            return

        item_existente = cart[item_existente_index]
        
        if item_existente['quantidade'] <= quantidade_a_remover:
            del cart[item_existente_index]
            msg = f"Item removido: {item_existente['nome']} (totalmente)."
        else:
            item_existente['quantidade'] -= quantidade_a_remover
            item_existente['subtotal'] = round(item_existente['quantidade'] * item_existente['preco_unitario'], 2)
            msg = f"{quantidade_a_remover} unidade(s) de {item_existente['nome']} removida(s)."

        active_carts[session_id_str] = cart
        self.redirect(f"/pdv?msg={msg}")


class ApiProdutoSearchHandler(tornado.web.RequestHandler):
    """API para buscar detalhes de um produto por código de barras."""
    
    def get(self):
        codigo = self.get_argument("codigo_barras", None)
        
        if not codigo:
            self.set_status(400) 
            self.write(json.dumps({"success": False, "message": "Código de barras não fornecido."}))
            return

        produto_encontrado = get_produto_por_codigo(codigo)

        if produto_encontrado:
            produto_para_json = {
        "nome": produto_encontrado['nome'],
        "preco": produto_encontrado['preco'],
        "estoque": produto_encontrado['estoque'],
        "codigo_barras": produto_encontrado['codigo_barras'],
        "img": f"https://via.placeholder.com/80x80.png?text={produto_encontrado['nome'].split()[0].upper()}"
        }
            self.write(json.dumps({"success": True, "produto": produto_para_json}))
        else:
            self.set_status(404)
        self.write(json.dumps({"success": False, "message": f"Produto com código {codigo} não encontrado."}))
        
