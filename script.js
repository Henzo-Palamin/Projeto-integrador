/* ==========================================================================
   Nessa parte, é feita a definição do dicionário de tradução dos tipos em português
   ========================================================================== */
const nomesTipos = {
    normal: "Normal",
    fire: "Fogo",
    water: "Água",
    electric: "Elétrico",
    grass: "Grama",
    ice: "Gelo",
    fighting: "Lutador",
    poison: "Veneno",
    ground: "Terrestre",
    flying: "Voador",
    psychic: "Psíquico",
    bug: "Inseto",
    rock: "Pedra",
    ghost: "Fantasma",
    dragon: "Dragão",
    dark: "Sombrio",
    steel: "Aço",
    fairy: "Fada"
};

/* ==========================================================================
   Nessa parte, são selecionados todos os elementos do HTML necessários para as seções
   ========================================================================== */
// Elementos da Seção 1: Explore um Pokémon!
const formularioBusca = document.querySelector(".formulario-busca-pokemon");
const campoBusca = document.querySelector("#campo-busca-pokemon");
const tituloDetalhes = document.querySelector("#titulo-detalhes-pokemon");
const campoDescricao = document.querySelector("#pokemon-descricao");
const campoPeso = document.querySelector("#pokemon-peso");
const campoAltura = document.querySelector("#pokemon-altura");
const campoTipo = document.querySelector("#pokemon-tipo");
const campoFraquezas = document.querySelector("#pokemon-fraquezas");
const campoEficaz = document.querySelector("#pokemon-eficaz");
const statusBusca = document.querySelector("#status-busca-pokemon");

// Elementos da Seção 2: Monte seu time!
const cartoesTime = document.querySelectorAll(".cartao-membro-time");

// Elementos da Seção 3: Fale comigo!
const formularioSom = document.querySelector(".formulario-som-pokemon");
const campoSom = document.querySelector("#campo-som-pokemon");
const imagemSom = document.querySelector("#imagem-som-pokemon");
const fotoSom = document.querySelector(".foto-som-pokemon");
const nomeSom = document.querySelector(".nome-som-pokemon");
const botaoSom = document.querySelector("#botao-tocar-som");
const statusSom = document.querySelector("#status-som-pokemon");

// Variável global para armazenar o link de áudio do Pokémon atual
let audioPokemon;

/* ==========================================================================
   Nessa parte, ficam as funções utilitárias e de tratamento de texto/nomes
   ========================================================================== */
function nomeTipoEmPortugues(nome) {
    return nomesTipos[nome] || nome;
}

function prepararNomePokemon(valor) {
    return valor.trim().toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
}

/* ==========================================================================
   Nessa parte, são realizadas as requisições HTTP para a PokéAPI
   ========================================================================== */
// Busca os dados gerais do Pokémon (nome, id, peso, altura, tipos, sprites e gritos)
async function buscarPokemon(nome) {
    const resposta = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(prepararNomePokemon(nome))}`
    );

    if (!resposta.ok) {
        throw new Error("Pokémon não encontrado. Confira o nome ou o número informado.");
    }

    return resposta.json();
}

// Busca os dados da espécie (usado para encontrar as descrições da Pokédex em vários idiomas)
async function buscarEspecie(id) {
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar a descrição do Pokémon.");
    }

    return resposta.json();
}

// Busca as relações de dano de um determinado tipo (fraquezas e vantagens elementares)
async function buscarRelacoesTipo(nome) {
    const resposta = await fetch(`https://pokeapi.co/api/v2/type/${nome}`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar as relações do tipo do Pokémon.");
    }

    return resposta.json();
}

/* ==========================================================================
   Nessa parte, são formatadas a descrição, os tipos e obtida a imagem do Pokémon
   ========================================================================== */
// Formata a descrição: busca em português; se não houver, avisa e exibe a versão em inglês
function formatarDescricao(especie) {
    // 1. Procura pela entrada em português ('pt-br' ou 'pt')
    const entradaPt = especie.flavor_text_entries?.find(
        texto => ["pt-br", "pt"].includes(texto.language.name)
    );

    if (entradaPt) {
        return entradaPt.flavor_text.replace(/[\n\f]/g, " ");
    }

    // 2. Se não houver em português, busca em inglês ('en') e avisa o usuário
    const entradaEn = especie.flavor_text_entries?.find(
        texto => texto.language.name === "en"
    );

    if (entradaEn) {
        const descricaoIngles = entradaEn.flavor_text.replace(/[\n\f]/g, " ");
        return `Descrição em português não disponível na PokéAPI. Versão em inglês: "${descricaoIngles}"`;
    }

    // 3. Caso não haja descrição em nenhum desses idiomas
    return "Descrição não disponível na PokéAPI.";
}

// Converte a lista de tipos do Pokémon em texto legível em português
function formatarTipos(tipos) {
    return tipos.map(tipo => nomeTipoEmPortugues(tipo.type.name)).join(", ");
}

// Retorna a melhor imagem disponível (arte oficial em alta resolução ou sprite clássico)
function obterImagem(dados) {
    return dados.sprites.other?.["official-artwork"]?.front_default
        || dados.sprites.front_default
        || "";
}

// Atualiza o texto do tipo dentro dos slots do time mantendo a tag <strong>
function atualizarTipoTime(elemento, texto) {
    const rotulo = elemento.querySelector("strong");
    if (rotulo) {
        elemento.replaceChildren(rotulo, document.createTextNode(` ${texto}`));
    } else {
        elemento.textContent = `Tipo: ${texto}`;
    }
}

/* ==========================================================================
   Nessa parte, é feita a busca e exibição dos dados na Seção "Explore um Pokémon!"
   (Aqui são obtidos o nome, a descrição, o peso, a altura, o tipo, as fraquezas e as eficácias)
   ========================================================================== */
if (formularioBusca) {
    formularioBusca.addEventListener("submit", async event => {
        event.preventDefault();
        if (statusBusca) statusBusca.textContent = "Buscando Pokémon...";
        if (tituloDetalhes) tituloDetalhes.textContent = "Informações do Pokémon";
        
        // Limpa os campos enquanto a consulta é realizada
        [campoDescricao, campoPeso, campoAltura, campoTipo, campoFraquezas, campoEficaz]
            .forEach(campo => {
                if (campo) campo.textContent = "Aguardando consulta.";
            });

        try {
            // Busca os dados do Pokémon digitado
            const dados = await buscarPokemon(campoBusca.value);

            // Busca em paralelo a espécie (descrição) e os dados de cada tipo (vantagens/fraquezas)
            const [especie, relacoes] = await Promise.all([
                buscarEspecie(dados.id),
                Promise.all(dados.types.map(tipo => buscarRelacoesTipo(tipo.type.name)))
            ]);

            // Cálculo das fraquezas com base no dano recebido (multiplicador > 1)
            const fraquezasPossiveis = new Set(
                relacoes.flatMap(tipo => [
                    ...tipo.damage_relations.double_damage_from,
                    ...tipo.damage_relations.half_damage_from,
                    ...tipo.damage_relations.no_damage_from
                ].map(item => item.name))
            );

            const fraquezas = [...fraquezasPossiveis].filter(nome => {
                const multiplicador = relacoes.reduce((total, tipo) => {
                    const relacoesDano = tipo.damage_relations;
                    if (relacoesDano.double_damage_from.some(item => item.name === nome)) {
                        return total * 2;
                    }
                    if (relacoesDano.half_damage_from.some(item => item.name === nome)) {
                        return total * 0.5;
                    }
                    if (relacoesDano.no_damage_from.some(item => item.name === nome)) {
                        return 0;
                    }
                    return total;
                }, 1);

                return multiplicador > 1;
            });

            // Cálculo dos tipos contra os quais o Pokémon é super eficaz (dano dobrado)
            const eficaz = new Set(
                relacoes.flatMap(tipo => tipo.damage_relations.double_damage_to.map(item => item.name))
            );

            // Preenchimento de todos os dados do Pokémon na interface
            if (tituloDetalhes) tituloDetalhes.textContent = `Informações de ${dados.name}`;
            if (campoDescricao) campoDescricao.textContent = formatarDescricao(especie);
            if (campoPeso) campoPeso.textContent = `${dados.weight / 10} kg`;
            if (campoAltura) campoAltura.textContent = `${dados.height / 10} m`;
            if (campoTipo) campoTipo.textContent = formatarTipos(dados.types);
            if (campoFraquezas) campoFraquezas.textContent = fraquezas.map(nomeTipoEmPortugues).join(", ") || "Nenhuma";
            if (campoEficaz) campoEficaz.textContent = [...eficaz].map(nomeTipoEmPortugues).join(", ") || "Nenhum";
            if (statusBusca) statusBusca.textContent = "Consulta concluída com sucesso!";
        } catch (error) {
            console.error(error);
            if (statusBusca) statusBusca.textContent = error.message;
        }
    });
}

/* ==========================================================================
   Nessa parte, é feita a manipulação dos 6 cartões da Seção "Monte seu time"
   (Aqui são atualizados a imagem, o nome e os tipos dos membros do time)
   ========================================================================== */
cartoesTime.forEach(cartao => {
    const campo = cartao.querySelector("input");
    const imagem = cartao.querySelector(".imagem-membro-time");
    const tipo = cartao.querySelector(".tipo-membro-time");

    if (campo) {
        campo.addEventListener("change", async () => {
            // Se o campo for esvaziado pelo usuário, limpa o cartão
            if (!campo.value.trim()) {
                if (imagem) imagem.hidden = true;
                if (tipo) atualizarTipoTime(tipo, "Aguardando consulta.");
                return;
            }

            try {
                // Consulta os dados do Pokémon para o slot do time
                const dados = await buscarPokemon(campo.value);
                const imagemUrl = obterImagem(dados);

                if (imagem) {
                    imagem.src = imagemUrl;
                    imagem.alt = `Imagem de ${dados.name}`;
                    imagem.hidden = !imagemUrl;
                }

                if (tipo) {
                    atualizarTipoTime(tipo, formatarTipos(dados.types));
                }
            } catch (error) {
                if (imagem) imagem.hidden = true;
                if (tipo) atualizarTipoTime(tipo, error.message);
                console.error(error);
            }
        });
    }
});

/* ==========================================================================
   Nessa parte, é feita a busca e a reprodução de áudio na Seção "Fale comigo!"
   (Aqui é obtida a foto média e tocado o som/grito oficial do Pokémon)
   ========================================================================== */
// Evento de submissão do formulário de som
if (formularioSom) {
    formularioSom.addEventListener("submit", async event => {
        event.preventDefault();
        if (statusSom) statusSom.textContent = "Buscando Pokémon...";

        try {
            const dados = await buscarPokemon(campoSom.value);
            const imagem = obterImagem(dados);

            // Atualiza a imagem de tamanho médio e o nome do Pokémon
            if (imagemSom) {
                imagemSom.src = imagem;
                imagemSom.alt = `Imagem de ${dados.name}`;
                imagemSom.hidden = !imagem;
            }

            if (fotoSom) fotoSom.setAttribute("aria-hidden", "false");
            if (nomeSom) nomeSom.textContent = dados.name;

            // Armazena a URL do grito (som característico) do Pokémon
            audioPokemon = dados.cries?.latest || dados.cries?.legacy || null;
            if (botaoSom) botaoSom.disabled = !audioPokemon;

            if (statusSom) {
                statusSom.textContent = audioPokemon
                    ? "Pokémon carregado. Clique no botão Som para ouvir."
                    : "Este Pokémon não possui áudio disponível na PokéAPI.";
            }
        } catch (error) {
            if (imagemSom) imagemSom.hidden = true;
            audioPokemon = null;
            if (botaoSom) botaoSom.disabled = true;
            if (nomeSom) nomeSom.textContent = "Pokémon não encontrado.";
            if (statusSom) statusSom.textContent = error.message;
            console.error(error);
        }
    });
}

// Evento de clique para tocar o som do Pokémon consultado
if (botaoSom) {
    botaoSom.addEventListener("click", async () => {
        if (!audioPokemon) {
            if (statusSom) statusSom.textContent = "Nenhum áudio disponível para reproduzir.";
            return;
        }

        try {
            await new Audio(audioPokemon).play();
            if (statusSom) statusSom.textContent = "Reproduzindo o som do Pokémon!";
        } catch (error) {
            if (statusSom) statusSom.textContent = "Não foi possível reproduzir o áudio no navegador.";
            console.error(error);
        }
    });
}
