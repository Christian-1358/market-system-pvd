import tornado.ioloop
import tornado.web
from supermercado.sqlite import setup_db 
import os

from supermercado.handlers.mainhandler import (
    MainHandler, 
    ProdutoHandler, 
    RetiradaHandler, 
    RecebimentoHandler, 
    PdvHandler, 
    FinalizarVendaHandler,
    CancelarPedidoHandler, 
    ApiProdutoSearchHandler,
    RemoverItemHandler,     
    ProdutosApiHandler,
    VerificarSaldoHandler,
)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler), 
            (r"/produtos", ProdutoHandler), 
            (r"/retirada", RetiradaHandler), 
            (r"/recebimento", RecebimentoHandler),
            (r"/pvd/produtos", ProdutosApiHandler),
            (r"/pdv", PdvHandler), 
            (r"/pdv/finalizar", FinalizarVendaHandler),
            (r"/pdv/cancelar", CancelarPedidoHandler),  
            (r"/pdv/remover", RemoverItemHandler),  
            (r"/pdv/produtos", ProdutosApiHandler),  
            (r"/verificar", VerificarSaldoHandler),
        ]
        
        settings = {
            "template_path": os.path.join(os.path.dirname(__file__), "supermercado/templates"),
            "static_path": os.path.join(os.path.dirname(__file__), "supermercado/static"),
            "debug": True,
        }
        
        super().__init__(handlers, **settings)

def main():
    setup_db() 
    
    app = Application()
    port = 8888
    app.listen(port)
    print(f"Servidor Tornado iniciado em http://localhost:{port}")
    tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
    main()