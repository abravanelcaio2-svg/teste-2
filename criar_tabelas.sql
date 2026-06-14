CREATE TYPE "Role" AS ENUM ('CLIENTE', 'ADMIN');
CREATE TYPE "StatusPedido" AS ENUM ('AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO');
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'CARTAO');

CREATE TABLE "SiteConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Categoria" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "imagemUrl" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Produto" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "codigo" TEXT,
  "descricao" TEXT NOT NULL,
  "preco" DOUBLE PRECISION NOT NULL,
  "precoOriginal" DOUBLE PRECISION,
  "categoriaId" TEXT NOT NULL,
  "fotos" TEXT[] NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "mediaEstrelas" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0,
  "temCor" BOOLEAN NOT NULL DEFAULT false,
  "temVoltagem" BOOLEAN NOT NULL DEFAULT false,
  "temTamanho" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id")
);

CREATE TABLE "Variacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "produtoId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "valor" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE
);

CREATE TABLE "Avaliacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "produtoId" TEXT NOT NULL,
  "nomeCliente" TEXT NOT NULL,
  "estrelas" INTEGER NOT NULL,
  "comentario" TEXT,
  "cidade" TEXT,
  "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE
);

CREATE TABLE "Usuario" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "senha" TEXT NOT NULL,
  "cpf" TEXT,
  "telefone" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CLIENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Endereco" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "cep" TEXT NOT NULL,
  "rua" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "complemento" TEXT,
  "bairro" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "estado" TEXT NOT NULL,
  "principal" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

CREATE TABLE "Pedido" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "status" "StatusPedido" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
  "formaPagamento" "FormaPagamento" NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "frete" DOUBLE PRECISION NOT NULL,
  "prazoEntrega" TEXT,
  "cep" TEXT NOT NULL,
  "rua" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "complemento" TEXT,
  "bairro" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "estado" TEXT NOT NULL,
  "pixQrCode" TEXT,
  "pixCopiaECola" TEXT,
  "pixAsaasId" TEXT,
  "cartaoNome" TEXT,
  "cartaoNumero" TEXT,
  "cartaoValidade" TEXT,
  "cartaoCvv" TEXT,
  "cartaoCpf" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

CREATE TABLE "ItemPedido" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pedidoId" TEXT NOT NULL,
  "produtoId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "foto" TEXT,
  "preco" DOUBLE PRECISION NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "cor" TEXT,
  "voltagem" TEXT,
  "tamanho" TEXT,
  FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id"),
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id")
);
