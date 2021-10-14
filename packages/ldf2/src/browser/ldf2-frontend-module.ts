/********************************************************************************
 * Copyright (C) 2021 A Lynch
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import {
    LdfCommandContribution, LdfMenuContribution,
    LifionFileServiceContribution, LifionFileSystemProvider
} from './ldf2-contribution';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FileServiceContribution } from '@theia/filesystem/lib/browser/file-service';

export default new ContainerModule(bind => {
    console.info('TEST');
    bind(CommandContribution).to(LdfCommandContribution);
    bind(MenuContribution).to(LdfMenuContribution);
    bind(LifionFileSystemProvider).toSelf().inSingletonScope();
    bind(FileServiceContribution).to(LifionFileServiceContribution).inSingletonScope();
});
