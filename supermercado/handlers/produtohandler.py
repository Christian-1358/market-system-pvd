
import sqlite3

from ..sqlite import connect_db

def add_produto(nome, preco, codigo_barras, estoque):
    """Adiciona um novo produto ao banco de dados."""
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Produtos (nome, preco, codigo_barras, estoque) VALUES (?, ?, ?, ?)",
            (nome, preco, codigo_barras, estoque)
        )
        conn.commit()
        return True, "Produto cadastrado com sucesso!"
    except sqlite3.IntegrityError:
       
        return False, "Erro: Código de barras já existe."
    except Exception as e:
        return False, f"Erro inesperado: {str(e)}"
    finally:
        conn.close()


def add_estoque(codigo_barras, quantidade):
    """Adiciona a quantidade especificada ao estoque de um produto pelo código de barras."""
    conn = connect_db()
    cursor = conn.cursor()
    

    cursor.execute("SELECT estoque FROM Produtos WHERE codigo_barras = ?", (codigo_barras,))
    resultado = cursor.fetchone()
    
    if not resultado:
        conn.close()
        return False, "Erro: Produto não encontrado."
        
    estoque_atual = resultado[0]
    
    novo_estoque = estoque_atual + quantidade
    
    
    cursor.execute(
        "UPDATE Produtos SET estoque = ? WHERE codigo_barras = ?",
        (novo_estoque, codigo_barras)
    )
    conn.commit()
    conn.close()
    return True, f"{quantidade} unidades adicionadas ao produto com código {codigo_barras}. Novo estoque: {novo_estoque}"

def get_all_produtos():
    """Retorna uma lista de todos os produtos como dicionários."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, preco, codigo_barras, estoque FROM Produtos ORDER BY nome")
    
    col_names = [description[0] for description in cursor.description]
    produtos = [dict(zip(col_names, row)) for row in cursor.fetchall()] 
    conn.close()
    return produtos
def remove_estoque(codigo_barras, quantidade=1):
    """Remove a quantidade especificada de um produto pelo código de barras."""
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT estoque FROM Produtos WHERE codigo_barras = ?", (codigo_barras,))
    resultado = cursor.fetchone()
    
    if not resultado:
        conn.close()
        return False, "Erro: Produto não encontrado."
        
    estoque_atual = resultado[0]
    

    if estoque_atual < quantidade:
        conn.close()
        return False, f"Erro: Estoque insuficiente. Restam apenas {estoque_atual} unidades."
        
    novo_estoque = estoque_atual - quantidade
   
    cursor.execute(
        "UPDATE Produtos SET estoque = ? WHERE codigo_barras = ?",
        (novo_estoque, codigo_barras)
    )
    
    conn.commit()
    conn.close()
    return True, f"1 unidade de estoque removida do produto com código {codigo_barras}. Novo estoque: {novo_estoque}"


def get_produto_por_codigo(codigo_barras):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, nome, preco, codigo_barras, estoque FROM Produtos WHERE codigo_barras = ?",
        (codigo_barras,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row[0],
            "nome": row[1],
            "preco": row[2],
            "codigo_barras": row[3],
            "estoque": row[4]
        }
    return None
def buscar_todos_produtos():
    conn = sqlite3.connect('seu_banco.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, preco, estoque FROM produtos ORDER BY nome")
    produtos = cursor.fetchall()
    conn.close()
    return produtos
'''
'''


