import { readFileSync, writeFileSync, globSync } from 'node:fs';

const files = globSync('app/**/*.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Replace imports from @adonisjs/core/http for exceptions
  content = content.replace(
    /import\s+\{([^}]*ConflictException[^}]*)\}\s+from\s+'@adonisjs\/core\/http';/g,
    (match, imports) => {
      const cleaned = imports.replace(/NotFoundException/g, 'NotFoundException');
      return `import { ${cleaned} } from '#exceptions/http_exceptions';`;
    }
  );

  content = content.replace(
    /import\s+\{([^}]*NotFoundException[^}]*)\}\s+from\s+'@adonisjs\/core\/http';/g,
    (match, imports) => {
      return `import { ${imports} } from '#exceptions/http_exceptions';`;
    }
  );

  content = content.replace(
    /import\s+\{([^}]*BadRequestException[^}]*)\}\s+from\s+'@adonisjs\/core\/http';/g,
    (match, imports) => {
      return `import { ${imports} } from '#exceptions/http_exceptions';`;
    }
  );

  content = content.replace(
    /import\s+\{([^}]*UnauthorizedException[^}]*)\}\s+from\s+'@adonisjs\/core\/http';/g,
    (match, imports) => {
      return `import { ${imports} } from '#exceptions/http_exceptions';`;
    }
  );

  content = content.replace(
    /import\s+\{([^}]*ForbiddenException[^}]*)\}\s+from\s+'@adonisjs\/core\/http';/g,
    (match, imports) => {
      return `import { ${imports} } from '#exceptions/http_exceptions';`;
    }
  );

  content = content.replace(
    /import\s+\{([^}]*UnprocessableEntityException[^}]*)\}\s+from\s+'@adonisjs\/core\/http';/g,
    (match, imports) => {
      return `import { ${imports} } from '#exceptions/http_exceptions';`;
    }
  );

  if (content !== original) {
    writeFileSync(file, content);
    console.log('Fixed:', file);
  }
}

console.log('Done fixing exception imports');
