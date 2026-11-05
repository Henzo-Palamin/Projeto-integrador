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

function nomeTipoEmPortugues(nome) {
    return nomesTipos[nome] || nome;
}

function prepararNomePokemon(valor) {
    return valor.trim().toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
}

async function buscarPokemon(nome) {
    const resposta = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(prepararNomePokemon(nome))}`
    );

    if (!resposta.ok) {
        throw new Error("Pokémon não encontrado. Confira o nome ou o número informado.");
    }

    return resposta.json();
}

async function buscarEspecie(id) {
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar a descrição do Pokémon.");
    }

    return resposta.json();
}

async function buscarRelacoesTipo(nome) {
    const resposta = await fetch(`https://pokeapi.co/api/v2/type/${nome}`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar as relações do tipo do Pokémon.");
    }

    return resposta.json();
}

function formatarDescricao(especie) {
    const entrada = especie.flavor_text_entries.find(
        texto => ["pt-br", "pt"].includes(texto.language.name)
    );

    return entrada
        ? entrada.flavor_text.replace(/[\n\f]/g, " ")
        : "Descrição em português não disponível na PokéAPI.";
}

function formatarTipos(tipos) {
    return tipos.map(tipo => nomeTipoEmPortugues(tipo.type.name)).join(", ");
}

function obterImagem(dados) {
    return dados.sprites.other?.["official-artwork"]?.front_default
        || dados.sprites.front_default
        || "";
}

function atualizarTipoTime(elemento, texto) {
    const rotulo = elemento.querySelector("strong");
    elemento.replaceChildren(rotulo, document.createTextNode(` ${texto}`));
}

formularioBusca.addEventListener("submit", async event => {
    event.preventDefault();
    statusBusca.textContent = "Buscando Pokémon...";
    tituloDetalhes.textContent = "Informações do Pokémon";
    [campoDescricao, campoPeso, campoAltura, campoTipo, campoFraquezas, campoEficaz]
        .forEach(campo => {
            campo.textContent = "Aguardando consulta.";
        });

    try {
        const dados = await buscarPokemon(campoBusca.value);
        const [especie, relacoes] = await Promise.all([
            buscarEspecie(dados.id),
            Promise.all(dados.types.map(tipo => buscarRelacoesTipo(tipo.type.name)))
        ]);
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
        const eficaz = new Set(
            relacoes.flatMap(tipo => tipo.damage_relations.double_damage_to.map(item => item.name))
        );

        tituloDetalhes.textContent = `Informações de ${dados.name}`;
        campoDescricao.textContent = formatarDescricao(especie);
        campoPeso.textContent = `${dados.weight / 10} kg`;
        campoAltura.textContent = `${dados.height / 10} m`;
        campoTipo.textContent = formatarTipos(dados.types);
        campoFraquezas.textContent = fraquezas.map(nomeTipoEmPortugues).join(", ") || "Nenhuma";
        campoEficaz.textContent = [...eficaz].map(nomeTipoEmPortugues).join(", ") || "Nenhum";
        statusBusca.textContent = "Consulta concluída.";
    } catch (error) {
        console.error(error);
        statusBusca.textContent = error.message;
    }
});

const cartoesTime = document.querySelectorAll(".cartao-membro-time");

cartoesTime.forEach(cartao => {
    const campo = cartao.querySelector("input");
    const imagem = cartao.querySelector(".imagem-membro-time");
    const tipo = cartao.querySelector(".tipo-membro-time");

    campo.addEventListener("change", async () => {
        if (!campo.value.trim()) {
            imagem.hidden = true;
            atualizarTipoTime(tipo, "Aguardando consulta.");
            return;
        }

        try {
            const dados = await buscarPokemon(campo.value);
            const imagemUrl = obterImagem(dados);
            imagem.src = imagemUrl;
            imagem.alt = `Imagem de ${dados.name}`;
            imagem.hidden = !imagemUrl;
            atualizarTipoTime(tipo, formatarTipos(dados.types));
        } catch (error) {
            imagem.hidden = true;
            atualizarTipoTime(tipo, error.message);
            console.error(error);
        }
    });
});

const formularioSom = document.querySelector(".formulario-som-pokemon");
const campoSom = document.querySelector("#campo-som-pokemon");
const imagemSom = document.querySelector("#imagem-som-pokemon");
const fotoSom = document.querySelector(".foto-som-pokemon");
const nomeSom = document.querySelector(".nome-som-pokemon");
const botaoSom = document.querySelector("#botao-tocar-som");
const statusSom = document.querySelector("#status-som-pokemon");
let audioPokemon;

formularioSom.addEventListener("submit", async event => {
    event.preventDefault();
    statusSom.textContent = "Buscando Pokémon...";

    try {
        const dados = await buscarPokemon(campoSom.value);
        const imagem = obterImagem(dados);

        imagemSom.src = imagem;
        imagemSom.alt = `Imagem de ${dados.name}`;
        imagemSom.hidden = !imagem;
        fotoSom.setAttribute("aria-hidden", "false");
        nomeSom.textContent = dados.name;
        audioPokemon = dados.cries?.latest || dados.cries?.legacy || null;
        botaoSom.disabled = !audioPokemon;
        statusSom.textContent = audioPokemon
            ? "Pokémon carregado. Clique em Som para ouvir."
            : "Este Pokémon não possui áudio disponível.";
    } catch (error) {
        imagemSom.hidden = true;
        audioPokemon = null;
        botaoSom.disabled = true;
        nomeSom.textContent = "Pokémon não encontrado.";
        statusSom.textContent = error.message;
        console.error(error);
    }
});

botaoSom.addEventListener("click", async () => {
    if (!audioPokemon) {
        statusSom.textContent = "Nenhum áudio disponível para reproduzir.";
        return;
    }

    try {
        await new Audio(audioPokemon).play();
        statusSom.textContent = "Reproduzindo o som do Pokémon.";
    } catch (error) {
        statusSom.textContent = "Não foi possível reproduzir o áudio.";
        console.error(error);
    }
});
