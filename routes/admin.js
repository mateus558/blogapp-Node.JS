const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Categoria');
const Categoria = mongoose.model('categorias')
require('../models/Postagem')
const Postagem = mongoose.model('postagens')
const {ehAdmin} = require('../helpers/ehAdmin')

router.get('/', ehAdmin, (req, res) => {
    res.render('admin/index');
});

router.get('/postagens', ehAdmin, (req, res) => {
    Postagem.find().populate('categoria').sort({data:'desc'}).lean().then(postagens => {
        res.render("admin/postagens", {postagens: postagens})
    }).catch(err => {
        req.flash("error_msg", "Houve um erro ao listar as postagens.");
        res.redirect("/admin")
    });
});

router.get('/postagens/add', ehAdmin, (req, res) => {
    Categoria.find().lean().then(categorias =>{
        res.render('admin/addPostagem', {categorias: categorias});
    }).catch(err => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário.");
        res.redirect("/admin")
    });
});

router.post('/postagens/nova', ehAdmin, (req, res) => {
    let erros = [];

    if(req.body.categoria == "0"){
        erros.push({text: "Categoria invalida, registre uma categoria"});
    }

    if(erros.length > 0){
        res.render("admin/addPostagem", {erros: erros})
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria
        }
        Postagem.create(novaPostagem).then(() =>{
            req.flash("success_msg", "Postagem criada com sucesso!");
            res.redirect("/admin/postagens");
        }).catch(err => {
            console.log(`${err}`)
            req.flash("error_msg", "Houve um erro no salvamento da postagem");
            res.redirect("/admin/postagens")
        })
    }
});

router.get("/postagens/edit/:id", ehAdmin, (req, res) => {
    Postagem.findOne({_id: req.params.id}).lean().then(postagem =>{
        Categoria.find().lean().then(categorias =>{
            res.render("admin/editpostagem", {categorias: categorias, postagem: postagem})
        }).catch(err => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin/postagens")
        })
    }).catch(err => {
        req.flash("error_msg", "Houve um erro ao carregar o formulario de edição")
        res.redirect("/admin/postagens")
    })
});

router.post("/postagem/edit", ehAdmin, (req, res) => {
    Postagem.findOne({_id: req.body.id}).then(postagem => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash("success_msg", "Postagem editada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch(err =>{
            req.flash("error_msg", "Erro interno")
            res.redirect("/admin/postagens")
        })
    }).catch(err => {
        req.flash("error_msg", "Houve um erro ao salvar a edição")
        res.redirect("/admin/postagens")
    })
})

router.get('/postagens/deletar/:id', ehAdmin, (req, res) => {
    Postagem.remove({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Postagem deletada com sucesso!")
        res.redirect("/admin/postagens")
    }).catch(err => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/admin/postagens")
    })
})

router.get('/categorias', ehAdmin, (req, res) => {
    Categoria.find().sort({date: 'desc'}).lean().then(categorias => {
        res.render("admin/categorias", {categorias: categorias});
    }).catch(error => {
        req.flash("error_msg", "Houve um erro ao listar as categorias");
        res.redirect('/admin');
    });
});

router.get('/categorias/add', ehAdmin, (req, res) =>{
    res.render("admin/addCategoria");
});

router.post('/categorias/nova', ehAdmin, (req, res) => {
    var erros = []
    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({text: "Nome inválido"});
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({text: "Slug inválido"});
    }

    if(req.body.nome.length < 2){
        erros.push({text: "Nome da categoria muito pequeno"});
    }

    if(erros.length > 0){
        res.render("admin/addCategoria", {erros: erros});
    }else{
        Categoria.create({
            nome: req.body.nome,
            slug: req.body.slug
        }).then(() => {
            req.flash("success_msg", "Categoria criada com sucesso!");
            res.redirect("/admin/categorias");
        }).catch(err => {
            req.flash("error_msg", "Houve um erro ao salvar a categoria, tente novamente.");
            res.redirect("/admin/categorias");
        });
    }
});

router.get('/categorias/edit/:id', ehAdmin, (req, res) => {
    Categoria.findOne({_id: req.params.id}).lean().then(categoria => {
        res.render('admin/editCategorias', {categoria: categoria});
    }).catch(error => {
        req.flash("error_msg", "Essa categoria não existe");
        res.redirect("/admin/categorias");
    });
});

router.post('/categorias/edit', ehAdmin, (req, res) => {
    var erros = []
    
    if(!req.body.name || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({text: "Nome inválido"});
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({text: "Slug inválido"});
    }

    if(req.body.nome.length < 2){
        erros.push({text: "Nome da categoria muito pequeno"});
    }

    if(erros.length > 0){
        erros.forEach(erro => {
            req.flash("error_msg", erro.text);
        });
        res.redirect("/admin/categorias");
    }else{
        Categoria.findOne({_id: req.body.id}).then(categoria =>{
            categoria.nome = req.body.nome;
            categoria.slug = req.body.slug;

            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso");
                res.redirect("/admin/categorias");
            }).catch(err => {
                req.flash("error_msg", "Houve um erro interno ao salvar a edição da categorias");
                res.redirect("/admin/categorias")
            });
        }).catch(error => {
            req.flash("error_msg", "Houve um erro ao editar a categoria");
            res.render("/admin/categorias");
        });
    }
});

router.post("/categorias/deletar", ehAdmin, (req, res) => {
    Categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!");
        res.redirect("/admin/categorias");
    }).catch(err => {
        req.flash("error_msg", "Houve um erro ao deletar a categoria");
        res.redirect("/admin/categorias");
    });
});

module.exports = router;
