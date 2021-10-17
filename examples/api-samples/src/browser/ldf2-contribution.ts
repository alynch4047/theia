/********************************************************************************
 * Copyright (C) 2021 A Lynch
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { FileService, FileServiceContribution } from '@theia/filesystem/lib/browser/file-service';

import { LanguageGrammarDefinitionContribution, TextmateRegistry } from '@theia/monaco/lib/browser/textmate';

import {
    FileSystemProvider, FileSystemProviderWithFileReadWriteCapability,
    FileSystemProviderCapabilities, FileWriteOptions,
    WatchOptions, Stat, FileType, FileDeleteOptions,
    FileOverwriteOptions, FileChange, FileOpenOptions,
    FileSystemProviderWithFileFolderCopyCapability,
    FileSystemProviderWithOpenReadWriteCloseCapability,
    FileSystemProviderWithAccessCapability
}
    from '@theia/filesystem/lib/common/files';
import { Disposable, DisposableCollection } from '@theia/core';
import { Emitter } from '@theia/core/lib/common/event';
import { EncodingService } from '@theia/core/lib/common/encoding-service';

import { CommonMenus } from '@theia/core/lib/browser';
import * as iconv from 'iconv-lite';

export const LdfCommand = {
    id: 'Ldf.command',
    label: 'Say Hello'
};

export const LdfCommand2 = {
    id: 'Ldf.command2',
    label: 'Get Debug Info'
};

export const LdfCommandAddRootLifionFS = {
    id: 'Ldf.commandAddRootLifionFS',
    label: 'Add Root Lifion FS'
};

@injectable()
export class LScriptLanguageGrammarContribution implements LanguageGrammarDefinitionContribution {

    readonly id = 'lscript';
    readonly scopeName = 'source.lscript';

    registerTextmateLanguage(registry: TextmateRegistry): void {
        registry.registerTextmateGrammarScope(this.scopeName, {
            // eslint-disable-next-line @typescript-eslint/tslint/config
            async getGrammarDefinition() {
                return {
                    format: 'json',
                    content: require('../data/yourGrammar.tmLanguage.json'),
                };
            }
        });
        registry.mapLanguageIdToTextmateGrammar(this.id, this.scopeName);
    }
}

@injectable()
export class LdfCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService
    ) { }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(LdfCommand, {
            execute: () => this.messageService.info('Hello World 27!')
        });
        registry.registerCommand(LdfCommand2, {
            execute: () => this.messageService.info(this.workspaceService.toString())
        });
        registry.registerCommand(LdfCommandAddRootLifionFS, {
            execute: async () => {
                try {
                    this.messageService.info('Add LFS Root...');
                    const uri = new URI('lifion:/test/a/test/');
                    console.info('absolute path ' + uri.path.isAbsolute + ' ' + uri.displayName);
                    //                     this.workspaceService.spliceRoots(0, 0, uri);
                    // this.workspaceService.open(uri);

                    this.workspaceService.addRoot(uri);
                    console.info('Success: Lifion Root Added at  ' + uri.displayName);
                } catch (error) {
                    console.error('Lifion Root Failed!' + error);
                }
            }
        });
    };
}

@injectable()
export class LdfMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: LdfCommand.id,
            label: LdfCommand.label
        });
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: LdfCommand2.id,
            label: LdfCommand2.label
        });
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: LdfCommandAddRootLifionFS.id,
            label: LdfCommandAddRootLifionFS.label
        });
    }
}

const dirEntries = new Map();

async function getDocuments(): Promise<{ ids: string[] }> {
    const documents: { ids: string[][] } = await fetch('http://127.0.0.1:5000/documents', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json());
    const dir_details: string[] = [];
    try {
        for (const doc_info of documents.ids) {
            console.info(doc_info);
            dirEntries.set(doc_info[1], doc_info[0]);
            dir_details.push(doc_info[1]);
        }
    } catch (e) {
        console.info('ERROR ' + e);
    }
    return { ids: dir_details };
}

// async function getDocumentSize(id: string): Promise<{ size: integer }> {
//     const res = await fetch(`http://127.0.0.1:5000/document_size/${id}`, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//     })
//         .then(response => response.json());
//     return res;
// }

async function getDocumentScript(doc_name: string): Promise<{ script: string }> {
    const id = dirEntries.get(doc_name);
    const res = await fetch(`http://127.0.0.1:5000/document_script/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json());
    return res;
}

@injectable()
export class LifionFileSystemProvider implements Disposable, FileSystemProvider,
    FileSystemProviderWithFileReadWriteCapability,
    FileSystemProviderWithOpenReadWriteCloseCapability,
    FileSystemProviderWithFileFolderCopyCapability,
    FileSystemProviderWithAccessCapability {

    @inject(EncodingService) protected readonly encodingService: EncodingService;
    @inject(MessageService) private readonly messageService: MessageService;

    capabilities: FileSystemProviderCapabilities = FileSystemProviderCapabilities.FileReadWrite |
        FileSystemProviderCapabilities.Access |
        FileSystemProviderCapabilities.Trash |
        FileSystemProviderCapabilities.Update;

    private readonly onDidChangeCapabilitiesEmitter = new Emitter<void>();
    readonly onDidChangeCapabilities = this.onDidChangeCapabilitiesEmitter.event;

    private readonly onDidChangeFileEmitter = new Emitter<readonly FileChange[]>();
    readonly onDidChangeFile = this.onDidChangeFileEmitter.event;

    private readonly onFileWatchErrorEmitter = new Emitter<void>();
    readonly onFileWatchError = this.onFileWatchErrorEmitter.event;

    protected readonly toDispose = new DisposableCollection(
        this.onDidChangeFileEmitter,
        this.onDidChangeCapabilitiesEmitter,
        this.onFileWatchErrorEmitter
    );

    async copy(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
        console.info('copy');
        throw new Error('Method not implemented.');
    }

    async open(resource: URI, opts: FileOpenOptions): Promise<number> {
        console.info('open');
        return 1;
    }

    async close(fd: number): Promise<void> {
        console.info('close');
    }

    async read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
        console.info('read');
        // num bytes read
        return 3;
    }

    async write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
        console.info('write');
        // num bytes written
        return 3;
    }

    dispose(): void {
        console.info('dispose');
    }

    toString(): string {
        return 'Lifion File System Provider';
    }

    watch(resource: URI, opts: WatchOptions): Disposable {
        console.info('watch');
        return Disposable.NULL;
    }

    async stat(resource: URI): Promise<Stat> {
        console.info('stat ' + resource.path);
        let path = resource.path.toString();
        while (path.indexOf('lifion:') >= 1) {
            path = path.substring(path.indexOf('lifion:'));
        }
        console.info('path is ' + path);

        let size = 0;
        let type = FileType.File;
        if (path.endsWith('/test/')) {
            type = FileType.Directory;
            size = 10;
        } else {
            try {
                // const ix = path.lastIndexOf('/');
                // const doc_id = path.substring(ix + 1);
                // size = (await getDocumentSize(doc_id)).size;

                const data = this.readFile(resource);
                size = (await data).length;

            } catch (e) {
                size = 0;
            }
        }
        console.info('size is ', size);
        return {
            type: type,
            // millis from unix epoch
            ctime: 0,
            mtime: 1000000,
            size: size
        };
    }

    async mkdir(resource: URI): Promise<void> {
        console.info('mkdir');
    }

    async readdir(resource: URI): Promise<[string, FileType][]> {
        console.info('read dir ' + resource.displayName + ' 6');
        const results: [string, FileType][] = [];
        const ids: { ids: string[] } = await getDocuments();
        try {
            ids.ids.forEach(function (id_): void {
                results.push([id_, FileType.File]);
            });
        } catch (e) {
            console.info('error ' + e);
        }
        return results;
    }

    async delete(resource: URI, opts: FileDeleteOptions): Promise<void> {
        this.messageService.info('delete');
    }

    async rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
        this.messageService.info('rename');
    }

    async readFile(resource: URI): Promise<Uint8Array> {
        console.info('readFile');
        let path = resource.path.toString();
        while (path.indexOf('lifion:') >= 1) {
            path = path.substring(path.indexOf('lifion:'));
        }
        const ix = path.lastIndexOf('/');
        const doc_name = path.substring(ix + 1);
        const script = (await getDocumentScript(doc_name)).script;
        return iconv.encode(script, 'utf8');
    }

    async writeFile(resource: URI, content: Uint8Array, opts: FileWriteOptions): Promise<void> {
        console.info('writeFile');
    }

    async access(resource: URI, mode?: number): Promise<void> {
        return;
    }

    async fsPath(resource: URI): Promise<string> {
        return resource.displayName;
    }
}

@injectable()
export class LifionFileServiceContribution implements FileServiceContribution {

    SCHEME = 'lifion';

    @inject(MessageService) private readonly messageService: MessageService;
    @inject(LifionFileSystemProvider) private readonly lifionFileSystemProvider: LifionFileSystemProvider;

    registerFileSystemProviders(service: FileService): void {
        console.info('Register lifion file system');
        this.messageService.info('provide ' + this.lifionFileSystemProvider);

        service.onWillActivateFileSystemProvider(event => {
            this.messageService.info('event will now activate ' + event.scheme);
            if (event.scheme === this.SCHEME) {
                this.messageService.info('provide for scheme LIFION' + this.lifionFileSystemProvider);
                service.registerProvider(this.SCHEME, this.lifionFileSystemProvider);
            }
        });

    }

}
