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
// import { CommonMenus } from '@theia/core/lib/browser';

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
export class LdfCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService
    ) { }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(LdfCommand, {
            execute: () => this.messageService.info('Hello World 24!')
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

import { CommonMenus } from '@theia/core/lib/browser';

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

function str2ab(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
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

    copy(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
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
        this.messageService.info('watch ' + resource);
        return Disposable.NULL;
    }
    async stat(resource: URI): Promise<Stat> {
        console.info('stat ' + resource.displayName);

        let type;
        if (resource.path.name === 'test') {
            type = FileType.Directory;
        } else {
            type = FileType.File;
        }

        return {
            type: type,
            // millis from unix epoch
            ctime: 0,
            mtime: 1000000,
            size: 10
        };
    }
    async mkdir(resource: URI): Promise<void> {
        console.info('mkdir');
    }
    async readdir(resource: URI): Promise<[string, FileType][]> {
        console.info('readdir ' + resource.displayName);
        return [['childFile', FileType.File]];
    }
    async delete(resource: URI, opts: FileDeleteOptions): Promise<void> {
        this.messageService.info('delete');
    }
    async rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
        this.messageService.info('rename');
    }

    async readFile(resource: URI): Promise<Uint8Array> {
        console.info('readFile');
        return str2ab('ABC');
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
