var puppeteer = require('puppeteer');
var asyncForEach = require('asyncForEach');
var fs = require('fs').promises;
var async = require('async');
var request = require('request');

const { Cfg } = require('./util/Constants');
var funcoes = require('./funcoes');
const { Console } = require('console');

var browser;
var page;

var ListClientes = {};
var ListCategorias = {};
var ListProdutos = {};
var ListProdutosFotos = {};

/*
########################################################################
########################################################################
*/

async function Acc_Login()
{

    // -----------------------

    funcoes.Log("---------");
    funcoes.Log("Entrando na Funcao: Acc_Login");

    // -----------------------

    try {

        await page.goto(Cfg.Dominio + "admin/login");

        await page.type('input[name=email]', Cfg.Autenticacao.Usuario, {delay: 50});
        await page.type('input[name=password]', Cfg.Autenticacao.Senha, {delay: 50});

        await page.evaluate(() => {

            $("#submit").click();
            
        });

        await page.waitForNavigation();

        if( page.url() == Cfg.Dominio + "admin/dashboard" )
        {

            funcoes.Log("Sucesso em Logar");

            return true;

        }else{

            funcoes.Log("Falha em Logar, Direcionado para: " + page.url());

            return false;

        }
        
    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_Login");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

/*
########################################################################
########################################################################
*/

async function Acc_Clientes()
{

    // -----------------------

    funcoes.Log("--");
    funcoes.Log("Entrando na Funcao: Acc_Clientes");

    // -----------------------

    try {

        await page.goto(Cfg.Dominio + "admin/customers");
        
        let QtdPaginas = await page.evaluate(() => {
        
            try {

                let DadQtdEle               = document.querySelector('.pagination li:last-child').querySelector('a').href;
                DadQtdEle                   = DadQtdEle.split("/");
                DadQtdEle                   = DadQtdEle.reverse();

                let DadQtdPaginas           = DadQtdEle[0];
                DadQtdPaginas               = DadQtdPaginas / 15;
                DadQtdPaginas               = DadQtdPaginas + 1;

                if( DadQtdPaginas < 1 )
                {

                    DadQtdPaginas               = 1;

                }
                
                return DadQtdPaginas;

            } catch(err) {

                return 1;
        
            }

        });

        //QtdPaginas = 1;

        for( let Pagina=1; Pagina<=QtdPaginas; Pagina++ )
        {

            funcoes.Log("Pagina: " + Pagina + " de " + QtdPaginas);

            if( Pagina > 1 )
            {

                let QtdIndex        = ( Pagina * 15 ) - 15;

                funcoes.Log("Index: " + QtdIndex);
                
                await page.goto(Cfg.Dominio + "admin/customers/index/lastname/ASC/0/" + QtdIndex);

            }

            let TmpResults = await page.evaluate(() => {
        
                let Results = {};
    
                Array.from(document.querySelectorAll('#customers > tbody > tr')).forEach(tr => {
                    
                    try {
    
                        let DadCodigoCliente        = tr.querySelectorAll("input")[0].value;
                        
                        let DadHash                 = DadCodigoCliente;
    
                        Results[DadHash]            = {
                            "CodigoCliente": DadCodigoCliente
                        };
    
                    } catch(err) {
        
                        //
                
                    }
    
                });
    
                return Results;
    
            });

            Object.keys(TmpResults).map(function(CHash) {
                    
                ListClientes[CHash] = TmpResults[CHash];

            });

        }

        return true;

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_Clientes");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

async function Acc_ClientesDetalhes()
{

    // -----------------------

    funcoes.Log("--");
    funcoes.Log("Entrando na Funcao: Acc_ClientesDetalhes");

    // -----------------------

    try {

        await async.eachSeries(
        Object.keys(ListClientes), 
        async function(HashReg){
            
            try {

                var RegCliente      = ListClientes[HashReg];

                //if( RegCliente["CodigoCliente"] == "7598235" )
                //{

                    funcoes.Log("Obtendo Detalhes dos Clientes");
                    funcoes.Log("CodigoCliente: " + RegCliente["CodigoCliente"]);

                    await page.goto(Cfg.Dominio + "admin/customers/form/" + RegCliente["CodigoCliente"]);

                    await page.evaluate(() => {

                        $(".edit_customer").click();
                        
                    });

                    ListClientes[HashReg] = await page.evaluate((RegCliente) => {

                        let NRegCliente                     = RegCliente;
                        
                        let DadNome1                        = document.querySelector("input[name='firstname']").value.trim();
                        let DadNome2                        = document.querySelector("input[name='lastname']").value.trim();
                        let DadCPF                          = document.querySelector("input[name='cpf']").value.trim();
                        let DadEmail                        = document.querySelector("input[name='email']").value.trim();
                        let DadTelefone                     = document.querySelector("input[name='phone']").value.trim();
                        let DadSexo                         = ( document.querySelector("select[name='sex'] option:checked").textContent.trim() == "Feminino" ) ? "F" : "M";
                        let DadDataNascimento               = document.querySelector("input[name='birthday']").value.trim();

                        let DadRazaoSocial                  = document.querySelector("input[name='company_alt']").value.trim();
                        let DadRazaoSocial2                 = document.querySelector("input[name='company']").value.trim();
                        let DadCNPJ                         = document.querySelector("input[name='cnpj']").value.trim();
                        let DadIE                           = document.querySelector("input[name='company_registration']").value.trim();
                        let DadIM                           = document.querySelector("input[name='company_registration_alt']").value.trim();

                        let DadIsAtivado                    = ( document.querySelector("select[name='active'] option:checked").textContent.trim() == "Ativo" ) ? "S" : "N";

                        let DadEnderecos                    = [];
                        
                        try {

                            Array.from(document.querySelectorAll('.dl-horizontal')).forEach(SubReg1 => {
                                
                                try {
                
                                    var DadEndereco             = SubReg1.querySelectorAll("dd")[0].innerHTML.trim();
                                    DadEndereco                 = DadEndereco.split("<br>");

                                    if( DadEndereco.length > 1 )
                                    {

                                        if( DadCNPJ != "" )
                                        {

                                            var DadENome                = DadEndereco[0].trim() + " " + DadEndereco[1].trim();
                                            var DadELogradouro          = DadEndereco[2].trim();

                                            if( DadEndereco[4].split(",").length > 1 )
                                            {

                                                var DadEComplemento         = DadEndereco[3].trim();
                                                var DadESubInfo1            = DadEndereco[4].trim();
                                                var DadEReferencia          = DadEndereco[6].trim();

                                                if( DadEReferencia != "" )
                                                {

                                                    DadEComplemento             = DadEComplemento + ", " + DadEReferencia;

                                                }

                                            }else{

                                                var DadEComplemento         = "";
                                                var DadESubInfo1            = DadEndereco[3].trim();
                                                var DadEReferencia          = "";

                                            }
                                            
                                            DadESubInfo1                = DadESubInfo1.split(",");

                                            var DadECidade              = DadESubInfo1[0].trim();
                                            var DadEBairro              = DadESubInfo1[1].trim();
                                            var DadESubInfo2            = DadESubInfo1[2].trim();
                                            DadESubInfo2                = DadESubInfo2.split(" ");

                                            var DadEEstado              = DadESubInfo2[0].trim();
                                            var DadECEP                 = DadESubInfo2[1].trim();

                                        }else{
                                                
                                            var DadENome                = DadEndereco[0].trim();
                                            var DadELogradouro          = DadEndereco[1].trim();

                                            if( DadEndereco[3].split(",").length > 1 )
                                            {

                                                var DadEComplemento         = DadEndereco[2].trim();
                                                var DadESubInfo1            = DadEndereco[3].trim();
                                                var DadEReferencia          = DadEndereco[5].trim();

                                                if( DadEReferencia != "" )
                                                {

                                                    DadEComplemento             = DadEComplemento + ", " + DadEReferencia;

                                                }

                                            }else{

                                                var DadEComplemento         = "";
                                                var DadESubInfo1            = DadEndereco[2].trim();
                                                var DadEReferencia          = "";

                                            }

                                            DadESubInfo1                = DadESubInfo1.split(",");

                                            var DadECidade              = DadESubInfo1[0].trim();
                                            var DadEBairro              = DadESubInfo1[1].trim();
                                            var DadESubInfo2            = DadESubInfo1[2].trim();
                                            DadESubInfo2                = DadESubInfo2.split(" ");

                                            var DadEEstado              = DadESubInfo2[0].trim();
                                            var DadECEP                 = DadESubInfo2[1].trim();

                                        }

                                        DadEnderecos.push({
                                        "Nome": DadENome,
                                        "Logradouro": DadELogradouro,
                                        "Complemento": DadEComplemento,
                                        "Cidade": DadECidade,
                                        "Bairro": DadEBairro,
                                        "Estado": DadEEstado,
                                        "CEP": DadECEP
                                        });

                                    }

                                } catch(err) {
                    
                                    //
                            
                                }
                
                            });

                        } catch(err) {
                    
                            //
                    
                        }

                        NRegCliente["Nome"]                 = (DadNome1 + " " + DadNome2).trim();
                        NRegCliente["CPF"]                  = DadCPF;
                        NRegCliente["Email"]                = DadEmail;
                        NRegCliente["Telefone"]             = DadTelefone;
                        NRegCliente["Sexo"]                 = DadSexo;
                        NRegCliente["DataNascimento"]       = DadDataNascimento;
                        NRegCliente["RazaoSocial"]          = DadRazaoSocial;
                        NRegCliente["RazaoSocial2"]         = DadRazaoSocial2;
                        NRegCliente["CNPJ"]                 = DadCNPJ;
                        NRegCliente["IE"]                   = DadIE;
                        NRegCliente["IM"]                   = DadIM;
                        NRegCliente["IsAtivado"]            = DadIsAtivado;
                        NRegCliente["Enderecos"]            = DadEnderecos;

                        return NRegCliente;

                    }, RegCliente);

                //}

            } catch(err) {

                funcoes.Log("Falha no Each: " + HashReg);
                funcoes.Log(err);
        
            }

            return true;

        });

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_ClientesDetalhes");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

/*
########################################################################
########################################################################
*/

async function Acc_Categorias()
{

    // -----------------------

    funcoes.Log("--");
    funcoes.Log("Entrando na Funcao: Acc_Categorias");

    // -----------------------

    try {

        await page.goto(Cfg.Dominio + "admin/categories");
    
        let TmpResults = await page.evaluate(() => {
    
            let Results = {};

            Array.from(document.querySelectorAll('#categories > tr')).forEach(tr => {
                
                try {

                    let DadCodigoCategoria      = tr.querySelectorAll("input")[0].value;
                    let DadNome                 = tr.querySelectorAll("div")[1].innerHTML.trim();
                    let DadIsAtivado            = ( tr.querySelectorAll("span")[0].innerHTML.trim() == "Ativa" ) ? "S" : "N";

                    let DadHash                 = DadCodigoCategoria;

                    Results[DadHash]            = {
                        "CodigoCategoria": DadCodigoCategoria,
                        "Nome": DadNome,
                        "IsAtivado": DadIsAtivado
                    };

                } catch(err) {
    
                    //
            
                }

            });

            return Results;

        });

        Object.keys(TmpResults).map(function(CHash) {
                
            ListCategorias[CHash] = TmpResults[CHash];

        });

        return true;

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_Categorias");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

/*
########################################################################
########################################################################
*/

async function Acc_Produtos()
{

    // -----------------------

    funcoes.Log("--");
    funcoes.Log("Entrando na Funcao: Acc_Produtos");

    // -----------------------

    try {

        await page.goto(Cfg.Dominio + "admin/products");
        
        let QtdPaginas = await page.evaluate(() => {
        
            try {

                let DadQtdEle               = document.querySelector('.pagination li:last-child').querySelector('a').href;
                DadQtdEle                   = DadQtdEle.split("/");
                DadQtdEle                   = DadQtdEle.reverse();

                let DadQtdPaginas           = DadQtdEle[0];
                DadQtdPaginas               = DadQtdPaginas / 25;
                DadQtdPaginas               = DadQtdPaginas + 1;

                if( DadQtdPaginas < 1 )
                {

                    DadQtdPaginas               = 1;

                }
                
                return DadQtdPaginas;

            } catch(err) {

                return 1;
        
            }

        });

        //QtdPaginas = 1;

        for( let Pagina=1; Pagina<=QtdPaginas; Pagina++ )
        {

            funcoes.Log("Pagina: " + Pagina + " de " + QtdPaginas);

            if( Pagina > 1 )
            {

                let QtdIndex        = ( Pagina * 25 ) - 25;

                funcoes.Log("Index: " + QtdIndex);
                
                await page.goto(Cfg.Dominio + "admin/products/index/name/ASC/0/" + QtdIndex);

            }

            let TmpResults = await page.evaluate(() => {
        
                let Results = {};
    
                Array.from(document.querySelectorAll('#products > tbody > tr')).forEach(tr => {
                    
                    try {
    
                        let DadCodigoProduto        = tr.querySelectorAll("input")[0].value;
                        
                        let DadHash                 = DadCodigoProduto;
    
                        Results[DadHash]            = {
                            "CodigoProduto": DadCodigoProduto
                        };
    
                    } catch(err) {
        
                        //
                
                    }
    
                });
    
                return Results;
    
            });

            Object.keys(TmpResults).map(function(CHash) {
                    
                ListProdutos[CHash] = TmpResults[CHash];

            });

        }

        return true;

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_Produtos");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

async function Acc_ProdutosDetalhes()
{

    // -----------------------

    funcoes.Log("--");
    funcoes.Log("Entrando na Funcao: Acc_ProdutosDetalhes");

    // -----------------------

    try {

        await async.eachSeries(
        Object.keys(ListProdutos), 
        async function(HashReg){
            
            try {

                var RegProduto      = ListProdutos[HashReg];

                //if( RegProduto["CodigoProduto"] == "6104391" )
                //{

                    funcoes.Log("Obtendo Detalhes dos Produtos");
                    funcoes.Log("CodigoProduto: " + RegProduto["CodigoProduto"]);

                    await page.goto(Cfg.Dominio + "admin/products/form/" + RegProduto["CodigoProduto"]);

                    ListProdutos[HashReg] = await page.evaluate((RegProduto) => {

                        let NRegProduto                     = RegProduto;
                        
                        let DadForm1                        = document.forms[1];

                        let DadNome                         = DadForm1.querySelector("input[name='name']").value.trim();
                        let DadPrecoNormal                  = DadForm1.querySelector("input[name='price']").value.trim();
                        let DadPrecoPromocional             = DadForm1.querySelector("input[name='saleprice']").value.trim();
                        let DadDescricao                    = DadForm1.querySelector("textarea[name='description']").value.trim();
                        let DadSKU                          = DadForm1.querySelector("input[name='sku']").value.trim();
                        let DadEstoque                      = DadForm1.querySelector("input[name='quantity']").value.trim();
                        let DadGTIN                         = DadForm1.querySelector("input[name='gtin_code']").value.trim();
                        let DadNCM                          = DadForm1.querySelector("input[name='ncm_code']").value.trim();
                        let DadPeso                         = DadForm1.querySelector("input[name='weight']").value.trim();
                        let DadComprimento                  = DadForm1.querySelector("input[name='width']").value.trim();
                        let DadProfundidade                 = DadForm1.querySelector("input[name='depth']").value.trim();
                        let DadAltura                       = DadForm1.querySelector("input[name='height']").value.trim();
                        let DadIsAtivado                    = ( DadForm1.querySelector("input[name='enabled']:checked") !== null ) ? "S" : "N";

                        let DadFotos                        = {};
                        let DadCategorias                   = [];
                        let DadVariacoes                    = {};

                        try {

                            Array.from(document.querySelectorAll('#picture-list > li')).forEach(SubReg1 => {
                                
                                try {
                
                                    let DadFCodigoImagem        = SubReg1.querySelectorAll("input")[0].value.trim();
                                    let DadFImagem              = SubReg1.querySelectorAll("img")[0].src.trim();

                                    if( DadFImagem != "" && DadFImagem != undefined )
                                    {

                                        DadFImagem                  = DadFImagem.replace("thumbnails", "full");

                                        let DadFHash                = DadFCodigoImagem;

                                        DadFotos[DadFHash]          = {
                                        "CodigoProduto": RegProduto["CodigoProduto"],
                                        "CodigoImagem": DadFCodigoImagem,
                                        "Imagem": DadFImagem
                                        };

                                    }

                                } catch(err) {
                    
                                ///
                            
                                }
                
                            });

                        } catch(err) {
                    
                            ///
                    
                        }

                        try {

                            document.querySelectorAll('#categories-list input:checked').forEach(SubReg2 => {
                                
                                try {
                
                                    let DadValue                = SubReg2.value.trim();

                                    if( DadValue != "" && DadValue != undefined )
                                    {

                                        DadCategorias.push(DadValue);

                                    }
                
                                } catch(err) {
                    
                                ///
                            
                                }
                
                            });

                        } catch(err) {
                    
                            ///
                    
                        }
                        
                        try {

                            Array.from(document.querySelectorAll('#variant-form .variant-form')).forEach(SubReg3 => {
                                
                                try {

                                    let DadVCodigoVariacao      = SubReg3.querySelectorAll("input")[5].value.trim();
                                    let DadVNome                = SubReg3.querySelectorAll("select option:checked")[0].textContent.trim();
                                    let DadVSKU                 = SubReg3.querySelectorAll("input")[0].value.trim();
                                    let DadVEstoque             = SubReg3.querySelectorAll("input")[1].value.trim();

                                    let DadVHash                = DadVCodigoVariacao;

                                    DadVariacoes[DadVHash]      = {
                                    "CodigoVariacao": DadVCodigoVariacao,
                                    "Nome": DadVNome,
                                    "SKU": DadVSKU,
                                    "Estoque": DadVEstoque
                                    };
                
                                } catch(err) {
                    
                                ///
                            
                                }
                
                            });

                        } catch(err) {
                    
                            ///
                    
                        }

                        NRegProduto["Nome"]                 = DadNome;
                        NRegProduto["PrecoNormal"]          = DadPrecoNormal;
                        NRegProduto["PrecoPromocional"]     = DadPrecoPromocional;
                        NRegProduto["Descricao"]            = DadDescricao;
                        NRegProduto["SKU"]                  = DadSKU;
                        NRegProduto["Estoque"]              = DadEstoque;
                        NRegProduto["GTIN"]                 = DadGTIN;
                        NRegProduto["NCM"]                  = DadNCM;
                        NRegProduto["Peso"]                 = DadPeso;
                        NRegProduto["Comprimento"]          = DadComprimento;
                        NRegProduto["Profundidade"]         = DadProfundidade;
                        NRegProduto["Altura"]               = DadAltura;
                        NRegProduto["IsAtivado"]            = DadIsAtivado;
                        NRegProduto["Fotos"]                = DadFotos;
                        NRegProduto["Categorias"]           = DadCategorias;
                        NRegProduto["Variacoes"]            = DadVariacoes;

                        return NRegProduto;

                    }, RegProduto);

                    try {

                        Object.keys(ListProdutos[HashReg]["Fotos"]).map(function(CHash) {

                            ListProdutosFotos[CHash] = ListProdutos[HashReg]["Fotos"][CHash];
        
                        });

                    } catch(err) {
                        
                        ///
                
                    }
                    
                //}

            } catch(err) {

                funcoes.Log("Falha no Each: " + HashReg);
                funcoes.Log(err);
        
            }

            return true;

        });

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_ProdutosDetalhes");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

/*
########################################################################
########################################################################
*/

async function Acc_SalvarDados(DadNome, DadListagem)
{

    // -----------------------

    funcoes.Log("--");
    funcoes.Log("Entrando na Funcao: Acc_SalvarDados");

    // -----------------------

    try {
    
        await fs.writeFile( __dirname + "/../tmp/" + DadNome, JSON.stringify(DadListagem), function(err) {
                        
            if(err)
            {

                funcoes.Log("Falha em Gravar Aquivo: " + DadNome);
                funcoes.Log(err);

            }
            
        });

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Acc_SalvarDados");
        funcoes.Log(err);
        
        // -----------------------

    }

    // -----------------------

}

/*
########################################################################
########################################################################
*/

async function Init()
{

    try {

        // -----------------------

        funcoes.Log("Iniciado");
        
        // -----------------------

        browser = await puppeteer.launch(Cfg.Puppeteer);
        page = (await browser.pages())[0];

        // -----------------------

        var IsLogin = await Acc_Login();

        if( IsLogin == false )
        {

            funcoes.Log("Falha em Logar");
            return false;

        }

        // -----------------------

        await Acc_Clientes();
        await Acc_ClientesDetalhes();

        await Acc_SalvarDados("Clientes.json", ListClientes);
        
        // -----------------------

        await Acc_Categorias();

        await Acc_SalvarDados("Categorias.json", ListCategorias);

        // -----------------------

        await Acc_Produtos();
        await Acc_ProdutosDetalhes();

        await Acc_SalvarDados("Produtos.json", ListProdutos);
        await Acc_SalvarDados("ProdutosFotos.json", ListProdutosFotos);
        
        // -----------------------

        await browser.close();

        // -----------------------

        funcoes.Log("Finalizado");
        
        // -----------------------

        process.exit();

        // -----------------------

    } catch(err) {
        
        // -----------------------

        funcoes.Log("Falha na Funcao: Init");
        funcoes.Log(err);
        
        // -----------------------

    }

}

/*
########################################################################
########################################################################
*/

module.exports.Init = Init;

/*
########################################################################
########################################################################
*/