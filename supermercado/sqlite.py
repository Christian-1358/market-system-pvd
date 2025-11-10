


import sqlite3

DATABASE_FILE = 'supermercado.db'

def connect_db():
    """Retorna uma conexão com o banco de dados."""
    return sqlite3.connect(DATABASE_FILE)

def setup_db():
    """Cria a tabela de Produtos e insere dados de teste se estiver vazia."""
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            preco REAL NOT NULL,
            codigo_barras TEXT UNIQUE NOT NULL,
            estoque INTEGER NOT NULL DEFAULT 0
        );
    """)
    
    cursor.execute("SELECT COUNT(*) FROM Produtos")
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("Inserindo dados de teste...")
        produtos_teste = [
             ("Arroz Branco 5kg", 25.90, "7891234567891", 50),
            ("Feijão Carioca 1kg", 8.50, "7891234567892", 80),
            ("Leite Integral 1L", 5.25, "7891234567893", 120),
            ("Detergente Neutro", 2.99, "7891234567894", 200),
            ("Biscoito Maizena", 3.49, "7891234567895", 150),
            ("Açúcar Refinado 1kg", 4.10, "7891234567896", 90),
            ("Óleo de Soja 900ml", 7.50, "7891234567897", 70),
            ("Café em Pó 500g", 15.99, "7891234567898", 110),
            ("Sabonete em Barra", 1.80, "7891234567899", 300),
            ("Macarrão Espaguete 500g", 4.50, "7891234567900", 180),
            ("Refrigerante Cola 2L", 8.99, "7891234567901", 60),
            ("Água Sanitária 1L", 3.50, "7891234567902", 140),
            ("Papel Higiênico 4 Rolos", 10.99, "7891234567903", 85),
            ("Creme Dental", 4.99, "7891234567904", 220),
            ("Sabão em Pó 1kg", 12.50, "7891234567905", 75),
            ("Desinfetante Floral 500ml", 6.20, "7891234567906", 160),
            ("Farinha de Trigo 1kg", 4.99, "7891234567907", 130),
            ("Sal Refinado 1kg", 2.20, "7891234567908", 250),
            ("Azeite Extra Virgem 500ml", 32.00, "7891234567909", 40),
            ("Atum Sólido em Óleo (lata)", 9.50, "7891234567910", 95),
            ("Milho Verde (lata)", 3.80, "7891234567911", 170),
            ("Geléia de Morango 300g", 11.50, "7891234567912", 65),
            ("Iogurte Natural 170g", 2.90, "7891234567913", 190),
            ("Manteiga com Sal 200g", 14.90, "7891234567914", 55),
            ("Pão de Queijo Congelado 1kg", 22.90, "7891234567915", 30),
            ("Água Mineral sem Gás 1.5L", 2.80, "7891234567916", 250),
            ("Cerveja Pilsen Lata 350ml", 4.20, "7891234567917", 180),
            ("Vinho Tinto Seco 750ml", 45.00, "7891234567918", 35),
            ("Batata Chips Grande", 11.90, "7891234567919", 90),
            ("Chocolate ao Leite 100g", 7.50, "7891234567920", 160),
            ("Shampoo Anticaspa 300ml", 18.90, "7891234567921", 70),
            ("Condicionador 300ml", 20.50, "7891234567922", 65),
            ("Fio Dental 50m", 6.80, "7891234567923", 110),
            ("Lâmina de Barbear (pack 2un)", 15.00, "7891234567924", 50),
            ("Protetor Solar FPS 30", 35.90, "7891234567925", 40),
            ("Molho de Tomate Tradicional", 3.10, "7891234567926", 195),
            ("Maionese Pote 500g", 8.90, "7891234567927", 80),
            ("Biscoito Cream Cracker", 4.25, "7891234567928", 140),
            ("Leite Condensado (lata)", 6.99, "7891234567929", 100),
            ("Creme de Leite (caixa)", 5.15, "7891234567930", 125),
            ("Pizza Calabresa Congelada", 25.90, "7891234567931", 30),
            ("Pilhas AA (pack 4)", 15.90, "7891234567932", 45),
            ("Saco de Lixo 50L (10un)", 9.50, "7891234567933", 60),
            ("Esponja de Cozinha (pack 3)", 4.00, "7891234567934", 170),
            ("Fósforo (caixa)", 1.50, "7891234567935", 280),
            ("Sabão Líquido para Roupas 3L", 29.90, "7891234567936", 55),
            ("Vassoura de Piaçava", 19.90, "7891234567937", 25),
            ("Lâmpada LED 9W", 8.50, "7891234567938", 90),
            ("Adoçante Líquido 100ml", 12.00, "7891234567939", 70),
            ("Pano de Chão", 5.00, "7891234567940", 130),
            ("Banana Prata (kg)", 7.90, "200000000001", 15),
            ("Tomate Cereja (un)", 12.00, "200000000002", 25),
            ("Pão Francês (un)", 0.60, "200000000003", 100),
            ("Carne Moída (kg)", 28.50, "200000000004", 10),
            ("Queijo Mussarela (kg)", 45.00, "200000000005", 12),
            ("Laranja Pêra (kg)", 5.50, "200000000006", 20),
            ("Alface Crespa (un)", 3.99, "200000000007", 45),
            ("Cebola (kg)", 6.50, "200000000008", 22),
            ("Maçã Gala (kg)", 10.90, "200000000009", 18),
            ("Cenoura (kg)", 5.90, "200000000010", 28),
            ("Peito de Frango (kg)", 19.90, "200000000011", 15),
            ("Salsicha Hot Dog (kg)", 14.50, "200000000012", 20),
            ("Pêra Williams (kg)", 15.90, "200000000013", 10),
            ("Brócolis (un)", 7.90, "200000000014", 35),
            ("Batata Doce (kg)", 4.90, "200000000015", 25),
            ("Sopa Instantânea (Sachê)", 3.50, "7891234567941", 150),
            ("Bebida Isotônica Limão 500ml", 6.99, "7891234567942", 80),
            ("Salgadinho Queijo 80g", 5.50, "7891234567943", 110),
            ("Barra de Cereal", 2.10, "7891234567944", 200),
            ("Pipoca para Micro-ondas", 4.00, "7891234567945", 120),
            ("Cloro em Gel 500ml", 7.80, "7891234567946", 95),
            ("Lustra Móveis Spray", 14.50, "7891234567947", 65),
            ("Aromatizador de Ambiente", 10.90, "7891234567948", 75),
            ("Vela Branca (un)", 1.50, "7891234567949", 300),
            ("Luvas de Borracha (par)", 9.90, "7891234567950", 40),
            ("Caderno Espiral 1 Matéria", 18.00, "7891234567951", 50),
            ("Caneta Azul Esferográfica", 2.50, "7891234567952", 400),
            ("Lápis Preto HB", 1.50, "7891234567953", 350),
            ("Borracha Escolar", 0.99, "7891234567954", 500),
            ("Fita Adesiva Transparente", 5.90, "7891234567955", 100),
            ("Band-aid (pack 10)", 7.00, "7891234567956", 150),
            ("Álcool 70% 500ml", 9.50, "7891234567957", 110),
            ("Algodão Bolas 100g", 3.90, "7891234567958", 180),
            ("Vitamina C Efervescente", 22.90, "7891234567959", 45),
            ("Pastilha para Garganta", 8.50, "7891234567960", 60),
            ("Fralda Descartável (pack 20)", 35.00, "7891234567961", 30),
            ("Lenço Umedecido (pack 50)", 12.90, "7891234567962", 70),
            ("Shampoo Bebê", 16.50, "7891234567963", 55),
            ("Mamadeira 240ml", 25.00, "7891234567964", 20),
            ("Creme Preventivo de Assaduras", 18.90, "7891234567965", 40),
            ("Açúcar Mascavo 500g", 6.50, "7891234567966", 85),
            ("Fermento Biológico 10g", 2.00, "7891234567967", 250),
            ("Mostarda Amarela Pote", 5.90, "7891234567968", 105),
            ("Ketchup Tradicional", 10.50, "7891234567969", 90),
            ("Creme de Amendoim 500g", 19.90, "7891234567970", 35),
            ("Picolé de Fruta (un)", 3.00, "7891234567971", 200),
            ("Hambúrguer de Carne (pack 4)", 15.00, "7891234567972", 40),
            ("Vegetais Congelados (pacote)", 11.90, "7891234567973", 60),
            ("Picanha (kg)", 85.00, "200000000016", 5), 
            ("Salmão Fresco (kg)", 65.00, "200000000017", 8),
        ]
        
        cursor.executemany(
            "INSERT INTO Produtos (nome, preco, codigo_barras, estoque) VALUES (?, ?, ?, ?)",
            produtos_teste
        )
        print("8 produtos de teste adicionados.")
    
    conn.commit()
    conn.close()
''' 
o import do banco 

function carregarProdutos() {
    fetch("/pvd/produtos")
        .then(res => res.json())
        .then(data => { 
            todosOsProdutos = data; 
            renderizarCatalogo(todosOsProdutos); 
        })
        .catch(err => console.error("Erro ao carregar produtos:", err));
}

'''