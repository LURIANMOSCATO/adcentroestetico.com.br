import express  from "express";
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt, { hash } from 'bcrypt'
import cookieParser from "cookie-parser";
const salt = 10;
import jwt from 'jsonwebtoken';
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors(
  {
      origin: ["http://gestao-centroestetico.jelastic.saveincloud.net"],
      methods: ["POST", "GET", "PUT", "DELETE"],
      credentials: true
  }
));

const db = mysql.createConnection({
    host: "node153410-apis-backend.jelastic.saveincloud.net",
    port: "3306",
    user: "root",
    password: "TKDcoz89826",
    database: "centro_estetico"
});

app.get('/', (req, res) =>{
    const sql = "SELECT id, upper(cliente) AS cliente, CONCAT('(', SUBSTRING(telefone, 1, 2), ') ', SUBSTRING(telefone, 3, 5), '-', SUBSTRING(telefone, 8, 4)) as telefone, upper(profissional) AS profissional, lower(servico) AS servico, DATE_FORMAT(dataNascimento, '%d/%M/%Y') AS dataNascimento, DATE_FORMAT(dataServico, '%d/%M/%Y') AS dataServico, TIME_FORMAT(hora, '%Hh: %im') as hora, tempo, upper(pagamento) as pagamento, CONCAT('R$ ', FORMAT((valor), 2, 'pt_BR')) as valor, upper(gestante) AS gestante, upper(alergica) AS alergica, lower(alergia) AS alergia FROM agenda ORDER BY month(dataServico), day(dataServico), time(hora)";
    db.query(sql, (err, result) =>{
        if(err) return res.json({Message: "Error inside server"});
        return res.json(result);
    });
});

app.get('/agendas', (req, res) => {
  const sql = "SELECT id, upper(cliente) AS cliente, servico, profissional, DATE_FORMAT(dataServico, '%d/%m/%Y') AS dataServico, TIME_FORMAT(hora, '%Hh: %im') as hora, CONCAT('R$ ', FORMAT((valor), 2, 'pt_BR')) as valor FROM agenda";
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Erro na consulta SQL:', err);
      return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
    return res.json(result);
  });
});


app.get('/search', (req, res) => {
  const { startDate, endDate } = req.query;

  const sql = "SELECT * FROM agenda WHERE dataServico BETWEEN ? AND ?";
  db.query(sql, [startDate, endDate], (err, result) => {
      if (err) {
          return res.json({ Message: "Error inside server" });
      }
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
      "INSERT INTO realizados (`cliente`, `profissional`, `servico`, `valor`,`pagamento`, `dtnascimento`) SELECT cliente, profissional, servico, valor, pagamento, dataNascimento FROM agenda WHERE id = ?";
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
  const sql = 'UPDATE agenda SET `cliente`=?, `telefone`=?, `profissional`=?, `servico`=?, `dataNascimento`=?, `dataServico`=?, `hora`=?, `tempo`=?, `pagamento`=?, `valor`=?, `gestante`=?, `alergica`=?, `alergia`=? WHERE id =?';
  const id = req.params.id;
  db.query(sql, [req.body.cliente,
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

app.get('/clientsdeza/', (req, res) =>{
  const sql = "SELECT COUNT(id) AS id FROM agenda WHERE profissional = 'ANDREZA'";
  db.query(sql, (err, result) =>{
      if(err) return res.json({ Message: "Erro na Consulta!"});
      return res.json(result);
  })
})


app.get('/clientsdaia/', (req, res) =>{
  const sql = "SELECT COUNT(id) AS id FROM agenda WHERE profissional = 'DAIANE'";
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

app.delete('/deletepdt/:id', (req, res) => {
  const sql = "DELETE FROM produto WHERE idProduto = ?";
  const id =  req.params.id;
  db.query(sql, [id], (err, result) => {
      if(err) return res.json({Error: "Erro ao deletar Linha"});
      return res.json(result);
  })
})

app.get('/viewproduct/:id', (req, res) =>{
  const sql = "SELECT * FROM produto WHERE idProduto = ?";
  const id = req.params.id;

  db.query(sql,[id], (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.put('/updatep/:id', (req, res) => {
  const id = req.params.id; // Corrigido: obtendo o parâmetro 'id' corretamente

  const sql = 'UPDATE produto SET `tituloProduto`=?, `quantidadeProduto`=?, `valorProduto`=? WHERE idProduto=?';
  // Corrigido: Adicionando ponto de interrogação após `quantidadeProduto` e `valorProduto`

  db.query(sql, [
    req.body.tituloProduto,
    req.body.quantidadeProduto,
    req.body.valorProduto,
    id
  ], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Erro ao atualizar o produto.' });
    }
    return res.json(result);
  });
});


/*Enviar venda para o DB */

app.post('/finalizar_venda', (req, res) => {
  const { produtos, total } = req.body; // Dados enviados pelo cliente

  // Verifica se a requisição contém os dados necessários
  if (!produtos || !total) {
    return res.status(400).json({ error: 'Dados inválidos na requisição.' });
  }

  // Monta a consulta SQL para inserir a venda na tabela do banco de dados
  const sqlInsertVenda = `INSERT INTO vendas (total) VALUES (${total});`;

  db.beginTransaction((err) => {
    if (err) {
      console.error('Erro ao iniciar a transação:', err);
      return res.status(500).json({ error: 'Erro ao finalizar a venda.' });
    }

    db.query(sqlInsertVenda, (err, result) => {
      if (err) {
        console.error('Erro ao inserir a venda no banco de dados:', err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Erro ao finalizar a venda.' });
        });
      }

      const vendaId = result.insertId; // ID da venda inserida no banco

      // Monta a consulta SQL para inserir os produtos vendidos na tabela do banco de dados
      const values = produtos.map(
        (produto) => `(${vendaId}, ${produto.produto_id}, '${produto.titulo}', ${produto.quantidade}, ${produto.valor.replace(',', '.')})`
      ).join(', ');
      console.log('produtos a inserir', values)

       const sqlInsertProdutos = `INSERT INTO produtos_vendidos (venda_id, produto_id, titulo, quantidade, valor) 
        VALUES ${values}
        ON DUPLICATE KEY UPDATE venda_id = VALUES(venda_id), quantidade = quantidade + VALUES(quantidade);`;

      db.query(sqlInsertProdutos, (err) => {
        if (err) {
          console.error('Erro ao inserir os produtos vendidos no banco de dados:', err);
          return db.rollback(() => {
            res.status(500).json({ error: 'Erro ao finalizar a venda.' });
          });
        }

        produtos.forEach((produto) => {
          const sqlUpdateEstoque = `UPDATE produto SET quantidadeProduto = quantidadeProduto - ${produto.quantidade} WHERE idProduto = ${produto.produto_id};`;
          db.query(sqlUpdateEstoque, (err) => {
            if (err) {
              console.error('Erro ao atualizar o estoque:', err);
              return db.rollback(() => {
                res.status(500).json({ error: 'Erro ao atualizar o estoque.' });
              });
            }
          });
        });

        // Commit da transação
        db.commit((err) => {
          if (err) {
            console.error('Erro ao efetuar o commit da transação:', err);
            db.rollback(() => {
              res.status(500).json({ error: 'Erro ao finalizar a venda.' });
            });
          } else {
            res.status(200).json({ message: 'Venda finalizada com sucesso!' });
          }
        });
      });
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
  const sql = "SELECT CONCAT('R$ ', FORMAT(SUM(total), 2, 'pt_BR')) as total FROM vendas WHERE MONTH(register_datetime) = MONTH(CURDATE())";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/vendastotalw/', (req, res) =>{
  const sql = "SELECT CONCAT('R$ ', FORMAT(SUM(total), 2, 'pt_BR')) as total FROM vendas WHERE WEEK(register_datetime) = WEEK(CURDATE())";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/vendastotald/', (req, res) =>{
  const sql = "SELECT CONCAT('R$ ', FORMAT(SUM(total), 2, 'pt_BR')) as total FROM vendas WHERE DAY(register_datetime) = DAY(CURDATE())";

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
  const sql = "SELECT id, upper(cliente) as cliente, upper(profissional) as profissional, CONCAT('R$ ', FORMAT((valor), 2, 'pt_BR')) as valor, pagamento, DATE_FORMAT(dtCheck, '%d/%m/%Y') as dtCheck FROM realizados ORDER BY id DESC";

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

app.post('/register_servico', (req, res) =>{
  const sql = "INSERT INTO servico (`tituloServico`) VALUES (?)";
  console.log(req.body)
  const values = [
      req.body.tituloServico,
  ]
  db.query(sql, [values], (err, result) =>{
      if(!err) {
          res.status(200).json({success: "Produto Cadastrado."});
      } else {
          console.log(err);
      }
  })
})

app.delete('/deleteservico/:id', (req, res) => {
  const sql = "DELETE FROM servico WHERE id = ?";
  const id =  req.params.id;
  db.query(sql, [id], (err, result) => {
      if(err) return res.json({Error: "Erro ao deletar Linha"});
      return res.json(result);
  })
})


app.get('/faturatendimentos/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE MONTH(dtCheck) = MONTH(CURDATE())";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/faturatendimentosemana/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE WEEK(dtCheck) = WEEK(CURDATE())";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});


app.get('/faturatendimentosdia/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE DATE(dtCheck) = CURDATE()";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/pix/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE MONTH(dtCheck) = MONTH(CURDATE()) AND pagamento = 'PIX' ";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/dinheiro/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE MONTH(dtCheck) = MONTH(CURDATE()) AND pagamento = 'DINHEIRO' ";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/credito/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE MONTH(dtCheck) = MONTH(CURDATE()) AND pagamento = 'CRÉDITO' ";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});

app.get('/debito/', (req, res) =>{
  const sql = "SELECT  CONCAT('R$ ', FORMAT(SUM(valor), 2, 'pt_BR')) as valor FROM realizados WHERE MONTH(dtCheck) = MONTH(CURDATE()) AND pagamento = 'DÉBITO' ";

  db.query(sql, (err, result) =>{
      if(err) return res.json({Message: "Error inside server"});
      return res.json(result);
  });
});



/*

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if(!token) {
    return res.json({Message: "Faça Login p/ Acessar!"})
  } else {
    jwt.verify(token, "our-jsonwebtoken-secret-key", (err, decoded) => {
      if(err) {
        return res.json({Message: "Erro ao Logar, Verifique o seu login!"})
      } else {
        req.name = decoded.name;
        next();
      }
    })
  }
}

app.get('/vrf',verifyUser, (req, res) => {
  return res.json({status: "Success", name: req.name})
})

app.post('/login', (req, res) => {
  const sql = "SELECT * FROM `log-in` WHERE login = ? AND password = ?";
  db.query(sql, [req.body.login, req.body.password], (err, data) =>{
    if(err) return res.json({Message: "Server side error."});
    if(data.length > 0) {
      const name = data[0].name;
      const token = jwt.sign({name}, "our-jsonwebtoken-secret-key", {expiresIn: '12h'});
      res.cookie('token', token);
      return res.json({status: "Success"})
    }else {
      return res.json({Message: "Login Incorreto!"});
    }
  })
})

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ status: "Success" });
});



*/


app.post('/newuser', (req, res) => {
  const sql = "INSERT INTO login (`name`,`user`,`password`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
    if(err) return res.json({Error: "Erro ao Criar a Senha "});
    const values = [
      req.body.name,
      req.body.user,
      hash
    ]
    db.query(sql, [values], (err, result) => {
      if(err) return res.json({Error: "Erro ao inserir senha no banco"});
      return res.json({Status: "Success"});
    })
  })
})

const verifyUser = (req, res, next) =>{
  const token = req.cookies.token;
  if(!token) {
    return res.json({Error: "Não autorizado!"});
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if(err) {
        return res.json({Error: "Token de sessão Inválido!"});
      } else {
        req.name = decoded.name;
        next();
      }
    })
  }
}
app.get('/verify/', verifyUser, (req, res) =>{
  return res.json({Status: "Success", name: req.body.name});
})

app.post('/login', (req, res) => {
  const sql = "SELECT * FROM login WHERE user = ?";
  db.query(sql, [req.body.user], (err, data) => {
    if(err) return res.json({Error: "Erro ao Logar!"});
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if(err) return res.json({Error: "Senha inválida!"});
        if(response) {
          const name = data[0].name;
          const token = jwt.sign({name}, "jwt-secret-key", {expiresIn: '12h'});
          res.cookie('token', token)
          return res.json({Status: "Success"});
        } else {
          return res.json({Error: "Senha não confere"});
        }
      })
    } else {
      return res.json({Error: "Usuário Inválido!"});
    }
  })
})

app.get('/logout', (req, res) =>{
  res.clearCookie('token');
  return res.json({Status: "Success"});
})


app.listen(8081, ()=>{
    console.log("Online")
})