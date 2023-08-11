import express  from "express";
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    port: "3307",
    user: "admin",
    password: "admin",
    database: "centro_estetico"
});

app.get('/', (req, res) =>{
    const sql = "SELECT id, upper(cliente) AS cliente, telefone, upper(profissional) AS profissional, lower(servico) AS servico, DATE_FORMAT(dataNascimento, '%d/%m/%Y') AS dataNascimento, DATE_FORMAT(dataServico, '%d/%M/%Y') AS dataServico, TIME_FORMAT(hora, '%Hh: %im') as hora, tempo, upper(pagamento) as pagamento, CONCAT('R$ ', FORMAT((valor), 2, 'pt_BR')) as valor, upper(gestante) AS gestante, upper(alergica) AS alergica, lower(alergia) AS alergia FROM agenda ORDER BY month(dataServico), day(dataServico), time(hora)";
    db.query(sql, (err, result) =>{
        if(err) return res.json({Message: "Error inside server"});
        return res.json(result);
    });
});

app.post('/record_client', (req, res) =>{
    const sql = "INSERT INTO agenda (`cliente`, `telefone`, `profissional`, `servico`, `dataNascimento`, `dataServico`, `hora`, `tempo`, `pagamento`, `valor`, `gestante`, `alergica`, `alergia`) VALUES (?)";
    console.log(req.body)
    const values = [
        req.body.cliente,
        req.body.telefone,
        req.body.profissional,
        req.body.servico,
        req.body.dataNascimento,
        req.body.dataServico,
        req.body.hora,
        req.body.tempo,
        req.body.pagamento,
        req.body.valor,
        req.body.gestante,
        req.body.alergica,
        req.body.alergia
    ]
    db.query(sql, [values], (err, result) =>{
        if(!err) {
            res.status(200).json({success: "Agendamento Realizado!"});
        } else {
            console.log(err);
        }
    })
})

/*API para concluir serviço */

app.delete('/delete/:id', (req, res) => {
    const sql = "DELETE FROM agenda WHERE id = ?";
    const id =  req.params.id;
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Erro ao deletar Linha"});
        return res.json(result);
    })
})

app.post('/check/:id', (req, res) => {
    const sql =
      "INSERT INTO realizados (`cliente`, `profissional`, `servico`, `valor`, `dtnascimento`) SELECT cliente, profissional, servico, valor, dataNascimento FROM agenda WHERE id = ?";
    const id = req.params.id;
    db.query(sql, [id], (err, result) => {
      if (err) return res.json({ Error: "Erro ao Concluir Servico" });
      console.log(result);
      return res.json({ message: "Servico concluído com sucesso!" });
    });
  });

  app.delete('/cancel/:id', (req, res) => {
    const sql = "DELETE FROM agenda WHERE id = ?";
    const id =  req.params.id;
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Erro ao deletar Linha"});
        return res.json(result);
    })
})
  

/*API de busca*/

app.get('/api/search', (req, res) => {
    const { date, name } = req.query;
  
    const searchQuery = `%${name || ''}%`; // Using ILIKE for case-insensitive search
  
    // Use parameterized queries to prevent SQL injection
    const query = `
      SELECT * FROM agenda WHERE cliente ILIKE $1 AND ($2::date IS NULL OR dataServico = $2::date)`;
  
    const values = [searchQuery, date];
  
    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Error executing the search query' });
      } else {
        res.json(results.rows);
      }
    });
  });
  

/*API de busca*/

/*API de edição */

app.get('/view/:id', (req, res) =>{
  const sql = "SELECT * FROM agenda WHERE id = ?";
  const id = req.params.id;

  db.query(sql,[id], (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.put('/update/:id', (req, res) => {
  const sql = 'UPDATE agenda SET `cliente`=?, `telefone`=?, `profissional`=?, `servico`=?, `dataNascimento`=?, `dataServico`=?, `hora`=?, `tempo`=?, `valor`=?, `gestante`=?, `alergica`=?, `alergia`=? WHERE id =?';
  const id = req.params.id;
  db.query(sql, [req.body.cliente,
    req.body.telefone,
    req.body.profissional,
    req.body.servico,
    req.body.dataNascimento, 
    req.body.dataServico,
    req.body.hora,
    req.body.tempo,
    req.body.valor,
    req.body.gestante,
    req.body.alergica,
    req.body.alergia, id], (err, result) =>{
      if(err) return console.log(err);
      return res.json(result);
    });
});

/*API de edição */

/*API para concluir serviço*/

app.get('/clients/', (req, res) =>{
    const sql = "SELECT COUNT(id) AS id FROM agenda";
    db.query(sql, (err, result) =>{
        if(err) return res.json({ Message: "Erro na Consulta!"});
        return res.json(result);
    })
})

app.get('/clientsday/', (req, res) =>{
    const sql = "SELECT COUNT(id) AS id FROM agenda WHERE DATE(dataServico) = CURDATE()";
    db.query(sql, (err, result) =>{
        if(err) return res.json({ Message: "Erro na Consulta!"});
        return res.json(result);
    })
})

app.get('/clientsweek/', (req, res) =>{
    const sql = "SELECT COUNT(id) AS id FROM agenda WHERE WEEK(dataServico) = WEEK(CURDATE())";
    db.query(sql, (err, result) =>{
        if(err) return res.json({ Message: "Erro na Consulta!"});
        return res.json(result);
    })
})

app.get('/clientsmonth/', (req, res) =>{
    const sql = "SELECT COUNT(id) AS id FROM agenda WHERE MONTH(dataServico) = MONTH(CURDATE())";
    db.query(sql, (err, result) =>{
        if(err) return res.json({ Message: "Erro na Consulta!"});
        return res.json(result);
    })
})


app.get('/product_list', (req, res) =>{
    const sql = "SELECT idProduto, upper(tituloProduto) as tituloProduto, quantidadeProduto, FORMAT(valorProduto, 2, 'pt_BR') as valorProduto FROM produto WHERE quantidadeProduto > 0";

    db.query(sql, (err, result) =>{
        if(err) return res.json({Message: "Error inside server"});
        return res.json(result);
    });
});

app.get('/products', (req, res) =>{
  const sql = "SELECT idProduto, upper(tituloProduto) as tituloProduto, quantidadeProduto, CONCAT('R$ ', FORMAT((valorProduto), 2, 'pt_BR')) as valorProduto FROM produto ORDER BY idProduto DESC";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.post('/register_product', (req, res) =>{
  const sql = "INSERT INTO produto (`tituloProduto`, `quantidadeProduto`, `valorProduto`) VALUES (?)";
  console.log(req.body)
  const values = [
      req.body.tituloProduto,
      req.body.quantidadeProduto,
      req.body.valorProduto,
  ]
  db.query(sql, [values], (err, result) =>{
      if(!err) {
          res.status(200).json({success: "Produto Cadastrado."});
      } else {
          console.log(err);
      }
  })
})
/*Enviar venda para o DB */

app.post('/finalizar_venda', (req, res) => {
  const { produtos, total } = req.body; // Dados enviados pelo cliente

  // Verifica se a requisição contém os dados necessários
  if (!produtos || !total) {
    return res.status(400).json({ error: 'Dados inválidos na requisição.' });
  }

  // Monta a consulta SQL para inserir a venda na tabela do banco de dados
  const sqlInsert = `INSERT INTO vendas (total) VALUES (${total});`;
  db.query(sqlInsert, (err, result) => {
    if (err) {
      console.error('Erro ao inserir a venda no banco de dados:', err);
      return res.status(500).json({ error: 'Erro ao inserir a venda no banco de dados.' });
    }

    const vendaId = result.insertId; // ID da venda inserida no banco

    // Monta a consulta SQL para inserir os produtos vendidos na tabela do banco de dados
    const sqlInsertProdutos = produtos.map(
      (produto) => `INSERT INTO produtos_vendidos (venda_id, produto_id, titulo, quantidade, valor) 
      VALUES (${vendaId}, ${produto.produto_id}, '${produto.titulo}', ${produto.quantidade}, ${produto.valor.replace(',', '.')});`
    );

    // Executa todas as consultas de inserção dos produtos em uma única transação
    db.query(sqlInsertProdutos.join(' '), (err) => {
      if (err) {
        console.error('Erro ao inserir os produtos vendidos no banco de dados:', err);
        return res.status(500).json({ error: 'Erro ao inserir os produtos vendidos no banco de dados.' });
      }

      produtos.forEach((produto) => {
        const sqlUpdateEstoque = `UPDATE produto SET quantidadeProduto = quantidadeProduto - ${produto.quantidade} WHERE idProduto = ${produto.produto_id};`;
        db.query(sqlUpdateEstoque, (err) => {
          if (err) {
            console.error('Erro ao atualizar o estoque:', err);
            db.rollback(() => {
              res.status(500).json({ error: 'Erro ao atualizar o estoque.' });
            });
          }
        });
      });

      res.status(200).json({ message: 'Venda finalizada com sucesso!' });
    });
  });
});

/*Enviar venda para o DB */

app.get('/vendas/', (req, res) =>{
  const sql = "SELECT CONCAT('R$ ', FORMAT(SUM(total), 2, 'pt_BR')) as total FROM vendas WHERE DATE(register_datetime) = CURDATE()";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/vendastotal/', (req, res) =>{
  const sql = "SELECT CONCAT('R$ ', FORMAT(SUM(total), 2, 'pt_BR')) as total FROM vendas";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/vendasregister/', (req, res) =>{
  const sql = "SELECT Venda_id,  CONCAT('R$ ', FORMAT(total, 2, 'pt_BR')) as total, DATE_FORMAT(register_datetime, '%d/%m/%Y %H:%i') as register_datetime FROM vendas ORDER BY register_datetime DESC";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/vendasrealizadas/', (req, res) =>{
  const sql = "SELECT venda_id, lower(titulo) as titulo, quantidade, CONCAT('R$ ', FORMAT(valor, 2, 'pt_BR')) as valor, DATE_FORMAT(datatime, '%d/%m/%Y %H:%i') as datatime FROM produtos_vendidos ORDER BY datatime DESC";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/servicosrealizados/', (req, res) =>{
  const sql = "SELECT id, upper(cliente) as cliente, upper(profissional) as profissional, CONCAT('R$ ', FORMAT((valor), 2, 'pt_BR')) as valor, DATE_FORMAT(dtNascimento, '%d/%m/%Y') as dtNascimento FROM realizados ORDER BY id DESC";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/servicos/', (req, res) =>{
  const sql = "SELECT * FROM servico";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});


app.get('/faturatendimentos/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});



app.listen(8081, ()=>{
    console.log("Online")
})